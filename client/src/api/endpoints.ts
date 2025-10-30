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

  // Activities / transactions (send and receive)
  getUserTransactions: {
    key: 'getUserTransactions',
    url: '/transactions',
  },

  getTransferById: {
    key: 'getTransferById',
    // caller should pass id to url function
    url: (id: string) => `/transfer/${id}`,
  },

  // wallet connect
  walletConnect: {
    key: 'walletConnect',
    url: '/wallet/connect',
  },

  // Non-custodial transfer endpoints
  initiateTransfer: {
    key: 'initiateTransfer',
    url: '/transfer/initiate',
  },
  completeTransfer: {
    key: 'completeTransfer',
    url: '/transfer/complete',
  },
};
