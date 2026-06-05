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

/**
 * Map raw Supabase auth errors to user-facing copy. The single-tenant flow uses
 * `shouldCreateUser: false`, so an unknown email surfaces as "Signups not allowed
 * for otp" — which we translate to a provisioning hint instead of leaking internals.
 */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("signups not allowed")) {
    return "That email isn’t set up for access yet. Accounts are provisioned by your administrator — ask them to add you.";
  }
  if (m.includes("rate limit") || m.includes("too many") || m.includes("only request")) {
    return "Too many sign-in attempts. Wait a minute and try again.";
  }
  if (m.includes("email") && m.includes("invalid")) {
    return "Enter a valid email address.";
  }
  return "Couldn’t send the sign-in link. Please try again, or contact your administrator.";
}

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
      emailRedirectTo: `${env.APP_URL}/auth/confirm?next=/chat`,
      // Single-tenant demo: users are provisioned by an admin, so don't
      // auto-create an auth user on unknown emails.
      shouldCreateUser: false,
    },
  });

  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  return { ok: true, email };
}
