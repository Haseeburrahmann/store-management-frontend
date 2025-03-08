export interface Store {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email?: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // These fields are added by the frontend or backend when getting store with manager
  manager_name?: string;
}

export interface StoreCreate {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email?: string;
  manager_id?: string;
  is_active?: boolean;
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