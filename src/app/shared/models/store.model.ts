// src/app/shared/models/store.model.ts

export interface Store {
  _id: string; // Standardize on _id for MongoDB consistency
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  manager_id?: string; // Ensure string type for IDs
  manager?: {
    _id: string;
    full_name: string;
  }; // Replace manager_name with proper object
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreCreate {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  manager_id?: string; // Allow setting manager on creation
  is_active: boolean;
}

export interface StoreUpdate {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  manager_id?: string | null; // null to remove manager
  is_active?: boolean;
}

export interface StoreResponse {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  manager_id?: string;
  manager?: {
    _id: string;
    full_name: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}