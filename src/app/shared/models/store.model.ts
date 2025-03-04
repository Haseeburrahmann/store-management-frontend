// src/app/shared/models/store.model.ts
export interface Store {
    id: string;
    _id?: string; 
    name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    phone: string;
    email: string;
    manager_id?: string;
    manager_name?: string;
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
    manager_id?: string;
    is_active?: boolean;
  }