import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'vtour_supabase_config';

export function getSupabaseConfig(): { url: string; anonKey: string } {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.url && parsed.anonKey) {
          url = parsed.url;
          anonKey = parsed.anonKey;
        }
      }
    } catch (_) {}
  }

  return { url, anonKey };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        url: url.trim(),
        anonKey: anonKey.trim(),
        updatedAt: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.warn('Could not save Supabase config to localStorage:', e);
  }
}

export function isCloudConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    url !== 'https://your-project.supabase.co' &&
    !url.includes('placeholder')
  );
}

// Global cached client instance
let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || url === 'https://your-project.supabase.co') {
    return null;
  }
  if (!cachedClient) {
    cachedClient = createClient(url, anonKey);
  }
  return cachedClient;
}

// Default export/singleton for server and client
export const isSupabaseConfigured = isCloudConfigured();
export const supabase = getSupabaseClient();
