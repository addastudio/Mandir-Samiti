import { createClient } from '@supabase/supabase-js';

/**
 * Superbase (Supabase) Connection Utility
 * 
 * Standardized to detect NEXT_PUBLIC_SUPERBASE_* keys as the primary source.
 */

const superbaseUrl = process.env.NEXT_PUBLIC_SUPERBASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const superbaseAnonKey = process.env.NEXT_PUBLIC_SUPERBASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSuperbaseConfigured = !!(superbaseUrl && superbaseAnonKey);

/**
 * The initialized Superbase client.
 */
export const superbase = isSuperbaseConfigured 
  ? createClient(superbaseUrl!, superbaseAnonKey!) 
  : null;

/**
 * Returns the active backend configuration status for system reporting.
 */
export function getBackendStatus() {
  return {
    firebase: {
      active: true,
      label: "Firebase (Primary)"
    },
    superbase: {
      active: isSuperbaseConfigured,
      label: isSuperbaseConfigured ? "Superbase (Active)" : "Superbase (Not Configured)",
      url: superbaseUrl ? `${superbaseUrl.substring(0, 15)}...` : 'N/A'
    }
  };
}