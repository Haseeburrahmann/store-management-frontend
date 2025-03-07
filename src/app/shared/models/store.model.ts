// src/app/shared/models/store.model.ts

import { User } from '../../core/auth/models/user.model';

/**
 * Store entity as returned from the API
 */
export interface StoreResponse {
  _id: string | any; // MongoDB ID can come as string or object
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email?: string;
  is_active: boolean;
  manager_id?: string | any;
  created_at: string | Date;
  updated_at: string | Date;
  // Nested objects
  manager?: {
    _id: string | any;
    email: string;
    full_name: string;
    role_id?: string | any;
    [key: string]: any;
  };
}

/**
 * Store entity standardized for frontend use
 */
export interface Store {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email?: string;
  is_active: boolean;
  manager_id?: string;
  created_at: string;
  updated_at: string;
  // Nested objects with consistent IDs
  manager?: User;
}

/**
 * Data required to create a new Store
 */
export interface StoreCreate {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email?: string;
  is_active?: boolean;
  manager_id?: string;
}

/**
 * Data allowed for updating a Store
 */
export interface StoreUpdate {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
  manager_id?: string;
}

/**
 * List response with pagination
 */
export interface StoreListResponse {
  items: StoreResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/**
 * Format address for display
 * @param store Store object
 * @returns Formatted address string
 */
export function formatStoreAddress(store: Store): string {
  let address = store.address;
  
  if (store.city) {
    address += `, ${store.city}`;
  }
  
  if (store.state) {
    address += `, ${store.state}`;
  }
  
  if (store.zip_code) {
    address += ` ${store.zip_code}`;
  }
  
  return address;
}