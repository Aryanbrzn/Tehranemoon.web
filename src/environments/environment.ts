export const environment = {
    production: false,
    apiUrl: 'http://localhost:5129',
    adminUrl: 'http://localhost:5057',
    webUrl: 'http://localhost:4200',
    uploadBaseUrl: 'http://localhost:5129/uploads',
    // JWT token settings
    tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
    accessTokenKey: 'tm_access',
    refreshTokenKey: 'tm_refresh'
};
