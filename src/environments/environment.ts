// src/environments/environment.ts
export const environment = {
    production: false,
    apiUrl: 'http://localhost:8000', // Your backend API URL
    defaultPageSize: 20,
    
    // Development helpers
    useMockAuth: true,             // Use mock authentication when API is unavailable
    useHardcodedPermissions: true  // Use hardcoded permissions for development
  };