// src/app/shared/models/inventory-request.model.ts
export interface InventoryRequestItem {
  name: string;
  quantity: number;
  unit_type: string; // "packet", "box", "single", etc.
  notes?: string;
}
  
export interface InventoryRequest {
  _id: string;
  store_id: string;
  store_name?: string;
  employee_id: string;
  employee_name?: string;
  items?: InventoryRequestItem[];
  item_count?: number; // Added for list view
  status: 'pending' | 'fulfilled' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at?: string;
  fulfilled_at?: string;
  fulfilled_by?: string;
  fulfilled_by_name?: string;
}
  
  export class InventoryRequestUtils {
    /**
     * Ensures an inventory request has all required fields, filling in defaults where necessary
     */
    static ensureComplete(request: Partial<InventoryRequest>): InventoryRequest {
      if (!request) {
        throw new Error('Cannot complete a null inventory request');
      }
      
      return {
        _id: request._id || '',
        store_id: request.store_id || '',
        store_name: request.store_name || '',
        employee_id: request.employee_id || '',
        employee_name: request.employee_name || '',
        items: request.items || [],
        status: request.status || 'pending',
        notes: request.notes || '',
        created_at: request.created_at || new Date().toISOString(),
        updated_at: request.updated_at || new Date().toISOString(),
        fulfilled_at: request.fulfilled_at,
        fulfilled_by: request.fulfilled_by,
        fulfilled_by_name: request.fulfilled_by_name
      };
    }
  }