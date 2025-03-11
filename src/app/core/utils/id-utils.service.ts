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
    
    for (const key in params) {
      if (params[key] != null && params[key] !== undefined) {
        if (key.includes('_id') || key === 'id') {
          result[key] = this.ensureString(params[key]);
        } else {
          result[key] = String(params[key]);
        }
      }
    }
    
    return result;
  }
}