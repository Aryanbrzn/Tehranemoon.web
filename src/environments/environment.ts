export const environment = {
    production: false,
    apiBaseUrl: 'http://localhost:5129',
    uploadBaseUrl: 'http://localhost:5129/uploads',
    adminBaseUrl: 'http://localhost:5129/admin',
    // JWT token settings
    tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
    accessTokenKey: 'tm_access',
    refreshTokenKey: 'tm_refresh'
};
