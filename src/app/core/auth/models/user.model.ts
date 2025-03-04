export interface User {
    _id: string;
    email: string;
    full_name: string;
    phone_number?: string;
    role_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface UserWithPermissions extends User {
    permissions?: string[];
  role?: string; // Add this field
  }
  
  export interface UserCreate {
    email: string;
    full_name: string;
    phone_number?: string;
    password: string;
  }
  
  export interface UserUpdate {
    full_name?: string;
    phone_number?: string;
    password?: string;
    role_id?: string;
    is_active?: boolean;
  }