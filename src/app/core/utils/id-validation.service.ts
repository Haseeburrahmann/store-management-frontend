import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IdValidationService {
  /**
   * Validates that the ID appears to be a valid MongoDB ObjectId
   * (24 character hex string)
   */
  isValidObjectId(id: any): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }
    
    // MongoDB ObjectIds are 24 character hex strings
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
  
  /**
   * Logs descriptive information about the ID to help with debugging
   */
  logIdInfo(id: any, context: string): void {
    if (!id) {
      console.error(`[${context}] ID is null or undefined`);
      return;
    }
    
    console.log(`[${context}] ID: ${id}, Type: ${typeof id}, Length: ${id.toString().length}`);
    
    if (this.isValidObjectId(id)) {
      console.log(`[${context}] ID appears to be a valid MongoDB ObjectId`);
      
      // Check if it looks like a shift ID
      if (this.isLikelyShiftId(id)) {
        console.warn(`[${context}] ID matches the pattern of a shift ID`);
      }
    } else {
      console.warn(`[${context}] ID does NOT appear to be a valid MongoDB ObjectId`);
    }
  }
  
  /**
   * Check if an ID appears to be a shift ID based on your database patterns
   */
  isLikelyShiftId(id: string): boolean {
    // Based on your data examples, shift IDs contain "bc" in them
    // Schedule IDs contain "ba" (from your example: 67d0b34408e886da93cf4bba)
    return id.includes('bc');
  }
  
  /**
   * Attempt to extract the correct ID from a complex object or shift 
   * where IDs might be confused
   */
  extractScheduleId(obj: any): string | null {
    if (!obj) return null;
    
    // If the object has a direct schedule_id property, use that
    if (obj.schedule_id && this.isValidObjectId(obj.schedule_id)) {
      return obj.schedule_id;
    }
    
    // If this object has an _id and appears to be a schedule
    if (obj._id && this.isValidObjectId(obj._id) && (obj.shifts || obj.week_start_date)) {
      return obj._id;
    }
    
    return null;
  }
}