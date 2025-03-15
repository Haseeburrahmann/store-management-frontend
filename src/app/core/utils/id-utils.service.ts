// src/app/core/utils/id-utils.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IdUtils {
  /**
   * Ensures an ID is in string format
   */
  public static ensureString(id: any): string {
    if (!id) return '';
    return String(id);
  }

  /**
   * Compare two IDs for equality, regardless of their format
   */
  public static areEqual(id1: any, id2: any): boolean {
    if (!id1 || !id2) return false;
    return String(id1) === String(id2);
  }

  /**
   * Creates a safe query parameter object with string IDs
   */
  public static createIdParams(params: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    
    console.log('Creating ID params from:', params); // Add debugging
    
    for (const key in params) {
      if (params[key] != null && params[key] !== undefined) {
        if (key.includes('_id') || key === 'id' || key === 'store_id' || key === 'employee_id') {
          // Explicitly include store_id and employee_id
          result[key] = this.ensureString(params[key]);
          console.log(`Processed ID field: ${key} = ${result[key]}`);
        } else {
          result[key] = String(params[key]);
        }
      }
    }
    
    console.log('Transformed params:', result); // Add debugging
    return result;
  }
}