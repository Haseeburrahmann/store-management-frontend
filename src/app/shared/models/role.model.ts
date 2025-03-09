// src/app/shared/models/role.model.ts
export interface Role {
    _id: string;
    name: string;
    description?: string;
    permissions: string[];
    created_at: string;
    updated_at: string;
  }