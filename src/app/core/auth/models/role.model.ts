export interface Role {
    _id: string;
    name: string;
    description?: string;
    permissions: string[];
    created_at: string;
    updated_at: string;
  }
  
  export interface RoleCreate {
    name: string;
    description?: string;
    permissions: string[];
  }
  
  export interface RoleUpdate {
    name?: string;
    description?: string;
    permissions?: string[];
  }