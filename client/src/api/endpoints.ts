export const endpoints = {
  // Authentication endpoints
  initiateTwitterLogin: {
    key: 'initiateTwitterLogin',
    url: '/auth/twitter',
  },
  getCurrentUser: {
    key: 'getCurrentUser',
    url: '/auth/me',
  },
  refreshUserToken: {
    key: 'refreshUserToken',
    url: '/auth/refresh',
  },
  
  // Transfer/Tip endpoints
  sendTip: {
    key: 'sendTip',
    url: '/tips/send',
  },
  getRecentActivity: {
    key: 'recentActivity',
    url: '/tips/recent',
  },
  getUserBalance: {
    key: 'userBalance',
    url: '/wallet/balance',
  },
  validateHandle: {
    key: 'validateHandle',
    url: '/tips/validate-handle',
  },
  
  // Additional tip endpoints for future use
  getTipHistory: {
    key: 'tipHistory',
    url: '/tips/history',
  },
  getTipById: {
    key: 'tipById',
    url: '/tips',
  },
  cancelTip: {
    key: 'cancelTip',
    url: '/tips/cancel',
  },
  retryTip: {
    key: 'retryTip',
    url: '/tips/retry',
  },
};
