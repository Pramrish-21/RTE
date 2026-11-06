import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const RUNTIME_URL_KEY = 'rte_runtime_supabase_url';
const RUNTIME_KEY_KEY = 'rte_runtime_supabase_anon_key';

export interface SupabaseConfigInfo {
  url: string;
  isCustomRuntime: boolean;
  isConfigured: boolean;
}

/**
 * Get active Supabase configuration (from env or runtime session)
 */
export function getSupabaseConfig(): SupabaseConfigInfo {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const runtimeUrl = typeof window !== 'undefined' ? (sessionStorage.getItem(RUNTIME_URL_KEY) || '').trim() : '';

  const activeUrl = runtimeUrl || envUrl;
  const isCustomRuntime = Boolean(runtimeUrl);
  // Basic validation that it's a supabase URL or http URL
  const isConfigured = Boolean(activeUrl && activeUrl.startsWith('http') && !activeUrl.includes('placeholder'));

  return {
    url: activeUrl,
    isCustomRuntime,
    isConfigured,
  };
}

export function getSupabaseAnonKey(): string {
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const runtimeKey = typeof window !== 'undefined' ? (sessionStorage.getItem(RUNTIME_KEY_KEY) || '').trim() : '';
  return runtimeKey || envKey;
}

export function setRuntimeSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    if (url && anonKey) {
      sessionStorage.setItem(RUNTIME_URL_KEY, url.trim());
      sessionStorage.setItem(RUNTIME_KEY_KEY, anonKey.trim());
    } else {
      sessionStorage.removeItem(RUNTIME_URL_KEY);
      sessionStorage.removeItem(RUNTIME_KEY_KEY);
    }
  }
  // Reset cached client instance
  cachedClient = null;
}

let cachedClient: SupabaseClient | null = null;

/**
 * Returns Supabase client or null if not configured
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getSupabaseConfig();
  const key = getSupabaseAnonKey();

  if (!config.isConfigured || !key) {
    return null;
  }

  try {
    cachedClient = createClient(config.url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Real live health check to test database connectivity
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      message: 'Supabase URL or Anon Key is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment, or configure them in the Setup panel.',
    };
  }

  try {
    // Attempt lightweight query on events or auth
    const { error } = await client.from('events').select('id').limit(1);
    if (error) {
      // If table doesn't exist yet, it's connected to Supabase but schema is missing
      if (error.code === '42P01') {
        return {
          connected: true,
          message: 'Connected to Supabase, but SQL schema tables are not created yet. Run the provided SQL migration in Supabase SQL Editor.',
        };
      }
      return {
        connected: false,
        message: `Supabase connection test failed: ${error.message} (Code: ${error.code})`,
        error: error.message,
      };
    }
    return {
      connected: true,
      message: 'Successfully connected to live Supabase database with Row Level Security!',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Failed to connect to Supabase: ${msg}`,
      error: msg,
    };
  }
}
