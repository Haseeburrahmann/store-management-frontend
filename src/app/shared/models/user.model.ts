export interface User {
    _id: string;
    email: string;
    full_name: string;
    phone_number?: string;
    role_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    
    // These fields are added by the frontend when getting user data with role
    role_name?: string;
    permissions?: string[];
  }
  
  export interface UserCreate {
    email: string;
    full_name: string;
    password: string;
    phone_number?: string;
    role_id?: string;
    is_active?: boolean;
  }
  
  export interface UserUpdate {
    email?: string;
    full_name?: string;
    phone_number?: string;
    password?: string;
    role_id?: string;
    is_active?: boolean;
  }
  
  export interface LoginRequest {
    username: string; // Using username for FastAPI compatibility
    password: string;
  }
  
  export interface LoginResponse {
    access_token: string;
    token_type: string;
  }