import Cookies from 'js-cookie';

export const setCookie = (token?: string) => {
  if (token) {
    Cookies.set('auth-token', token, {
      expires: 1,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }
};

export const getCookie = () => Cookies.get('auth-token');

export const removeCookie = () => Cookies.remove('auth-token');
