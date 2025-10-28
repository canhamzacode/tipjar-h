import TokenManager from '@/utils/cookies';
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = TokenManager.getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: string | null) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = TokenManager.getRefreshToken();

    if (!refreshToken) {
      TokenManager.removeTokens();
      window.location.href = '/';
      return Promise.reject(error);
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}${'/auth/refresh'}`,
        { refresh_token: refreshToken },
        { withCredentials: true }
      );

      const { access_token, refresh_token } = response.data.data;

      TokenManager.setTokens({
        accessToken: access_token,
        refreshToken: refresh_token,
      });

      originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

      processQueue(null, access_token);

      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      TokenManager.removeTokens();
      window.location.href = '/';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
