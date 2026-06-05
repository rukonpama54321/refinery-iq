"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getServerEnv, hasSupabaseEnv } from "@/lib/env";

export interface LoginState {
  ok: boolean;
  email?: string;
  error?: string;
}

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");

/** Send a passwordless magic-link / OTP email (delivered via Supabase → Resend SMTP). */
export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const email = parsed.data;

  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Auth is not configured yet (missing Supabase keys in .env)." };
  }

  const env = getServerEnv();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${env.APP_URL}/auth/confirm`,
      // Single-tenant demo: users are provisioned by an admin, so don't
      // auto-create an auth user on unknown emails.
      shouldCreateUser: false,
    },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, email };
}
