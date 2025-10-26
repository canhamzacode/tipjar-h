import Cookies from 'js-cookie';

const COOKIE_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
};

const defaultOptions = (expiresDays = 7) => ({
  expires: expiresDays,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
});

type TokenPair = {
  accessToken?: string | null;
  refreshToken?: string | null;
};

const TokenManager = {
  setTokens: (
    tokens: TokenPair,
    opts?: { accessExpiresDays?: number; refreshExpiresDays?: number }
  ) => {
    const { accessToken, refreshToken } = tokens || {};
    const { accessExpiresDays = 1 / 24 / 4, refreshExpiresDays = 7 } =
      opts || {};
    // default access expires ~15 minutes (1/24/4 days)
    if (accessToken) {
      Cookies.set(
        COOKIE_KEYS.access,
        accessToken,
        defaultOptions(accessExpiresDays)
      );
    }
    if (refreshToken) {
      Cookies.set(
        COOKIE_KEYS.refresh,
        refreshToken,
        defaultOptions(refreshExpiresDays)
      );
    }
  },

  getTokens: (): TokenPair => {
    return {
      accessToken: Cookies.get(COOKIE_KEYS.access) || null,
      refreshToken: Cookies.get(COOKIE_KEYS.refresh) || null,
    };
  },

  getAccessToken: (): string | null => {
    return Cookies.get(COOKIE_KEYS.access) || null;
  },

  getRefreshToken: (): string | null => {
    return Cookies.get(COOKIE_KEYS.refresh) || null;
  },

  removeTokens: () => {
    Cookies.remove(COOKIE_KEYS.access);
    Cookies.remove(COOKIE_KEYS.refresh);
  },

  removeAccessToken: () => Cookies.remove(COOKIE_KEYS.access),
  removeRefreshToken: () => Cookies.remove(COOKIE_KEYS.refresh),
};

export default TokenManager;

// Backwards compatible named exports
export const setCookie = (token?: string) =>
  TokenManager.setTokens({ accessToken: token });
export const getCookie = () => TokenManager.getAccessToken();
export const removeCookie = () => TokenManager.removeTokens();
