// src/app/core/auth/models/user.model.ts

export interface User {
  _id: string; // Consistently use string for MongoDB IDs
  email: string;
  full_name: string;
  phone_number?: string;
  role_id?: string; // Ensure role_id is string type
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWithPermissions extends User {
  permissions?: string[]; // Will handle both formats: "users:read" and "USERS:READ"
  role?: {
    _id: string;
    name: string;
  }; // Change to object with _id and name for consistency
}

export interface UserCreate {
  email: string;
  full_name: string;
  phone_number?: string;
  password: string;
  role_id?: string; // Added role_id as optional for user creation
}

export interface UserUpdate {
  full_name?: string;
  phone_number?: string;
  password?: string;
  current_password?: string; // Added for password change validation
  role_id?: string;
  is_active?: boolean;
}

export interface UserResponse {
  _id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role_id?: string;
  role?: {
    _id: string;
    name: string;
  };
  is_active: boolean;
  permissions?: string[];
  created_at: string;
  updated_at: string;
}