// src/app/core/utils/id-handler.ts

/**
 * Utility functions for handling MongoDB ObjectID conversions
 * 
 * This utility standardizes how we handle ObjectIDs throughout the application
 * to ensure consistent behavior regardless of whether the backend returns
 * an ObjectID as a string or an object.
 */

/**
 * Ensures an ID is converted to a string format
 * Handles both string IDs and MongoDB ObjectID objects with _id property
 * 
 * @param id The ID to convert (can be string, object with _id, or null/undefined)
 * @returns The ID as a string, or undefined if input is null/undefined
 */
export function ensureIdString(id: string | any | null | undefined): string | undefined {
    if (id === null || id === undefined) {
      return undefined;
    }
    
    // Handle string IDs
    if (typeof id === 'string') {
      return id;
    }
    
    // Handle MongoDB ObjectID-like objects
    if (typeof id === 'object') {
      // If object has _id or $oid properties (common MongoDB formats)
      if (id._id) {
        return ensureIdString(id._id);
      }
      
      if (id.$oid) {
        return id.$oid.toString();
      }
      
      // If object has toString() method, use it
      if (typeof id.toString === 'function') {
        const stringId = id.toString();
        
        // If toString() returns [object Object], it's not useful
        if (stringId !== '[object Object]') {
          return stringId;
        }
      }
    }
    
    // For unexpected formats, convert to string and warn
    console.warn('Unexpected ID format:', id);
    return String(id);
  }
  
  /**
   * Checks if a string is a valid MongoDB ObjectID
   * 
   * @param id The ID string to validate
   * @returns True if the ID is a valid MongoDB ObjectID format
   */
  export function isValidObjectId(id: string): boolean {
    // MongoDB ObjectIDs are 24 character hex strings
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
  
  /**
   * Converts an object's ID properties to string format
   * This is useful for standardizing data before passing to components
   * 
   * @param obj The object with potential ID properties
   * @param idFields Array of field names that should be treated as IDs
   * @returns A new object with ID fields converted to strings
   */
  export function standardizeIdFields<T extends object>(obj: T, idFields: string[] = ['_id', 'id']): T {
    if (!obj) return obj;
    
    const result = { ...obj };
    
    for (const field of idFields) {
      if (field in result) {
        const currentValue = (result as any)[field];
        (result as any)[field] = ensureIdString(currentValue);
      }
    }
    
    return result;
  }
  
  /**
   * Compare two IDs for equality, accounting for different formats
   * 
   * @param id1 First ID (string or object)
   * @param id2 Second ID (string or object)
   * @returns True if the IDs represent the same value
   */
  export function areIdsEqual(id1: string | any, id2: string | any): boolean {
    const stringId1 = ensureIdString(id1);
    const stringId2 = ensureIdString(id2);
    
    return stringId1 === stringId2;
  }