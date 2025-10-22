export const environment = {
    production: true,
    apiUrl: 'https://api.tehranemoon.app',
    adminUrl: 'https://admin.tehranemoon.app',
    webUrl: 'https://tehranemoon.app',
    uploadBaseUrl: 'https://api.tehranemoon.app/uploads',
    // JWT token settings
    tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
    accessTokenKey: 'tm_access',
    refreshTokenKey: 'tm_refresh'
};
