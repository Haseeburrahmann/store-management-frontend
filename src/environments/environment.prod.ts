// src/environments/environment.prod.ts
export const environment = {
    production: true,
    apiUrl: '/api', // Production API URL
    defaultPageSize: 20,
    
    // These should always be false in production
    useMockAuth: false,
    useHardcodedPermissions: false
  };