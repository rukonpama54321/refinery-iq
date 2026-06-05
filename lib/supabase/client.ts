// Supabase client for Client Components (browser).
// Only invoked at runtime in the browser, never during prerender, so it is
// safe even before NEXT_PUBLIC_ env values are configured.
"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

export function createClient() {
  const env = getPublicEnv();
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
