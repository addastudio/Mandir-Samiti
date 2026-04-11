
import { createClient } from '@supabase/supabase-js';

/**
 * Superbase (Supabase) Connection Utility
 * 
 * This file detects if the project has been configured with Superbase credentials.
 * It provides a conditional client that can be used if the system is migrating 
 * from Firebase to Superbase.
 */

// We check for both "SUPERBASE" and "SUPABASE" prefixes for maximum flexibility
const superbaseUrl = process.env.NEXT_PUBLIC_SUPERBASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const superbaseAnonKey = process.env.NEXT_PUBLIC_SUPERBASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSuperbaseConfigured = !!(superbaseUrl && superbaseAnonKey);

/**
 * The initialized Superbase client.
 * Will be null if environment variables are missing.
 */
export const superbase = isSuperbaseConfigured 
  ? createClient(superbaseUrl!, superbaseAnonKey!) 
  : null;

/**
 * Returns the active backend configuration status.
 */
export function getBackendStatus() {
  return {
    firebase: {
      active: true, // Core system remains on Firebase for now
      project: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Configured'
    },
    superbase: {
      active: isSuperbaseConfigured,
      url: superbaseUrl ? `${superbaseUrl.substring(0, 12)}...` : 'Not Configured'
    }
  };
}
