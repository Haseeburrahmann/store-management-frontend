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

// Extended interface for user creation/updates that may include a password
export interface UserWithPassword extends Partial<User> {
password?: string;
}