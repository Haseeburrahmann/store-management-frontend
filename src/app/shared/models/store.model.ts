// src/app/shared/models/store.model.ts
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
    manager_name?: string; // Extended property for frontend use
  }