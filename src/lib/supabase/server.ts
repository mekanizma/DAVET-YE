import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "./env";

type PendingCookie = { name: string; value: string; options: CookieOptions };

/** Cookie session for the signed-in visitor or admin. */
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          /* Server Components cannot write cookies; middleware refreshes the session. */
        }
      },
    },
  });
}

/**
 * Route handlers that sign in or out must copy the auth cookies onto the
 * response they return. `cookies().set` alone is not always attached.
 */
export async function createSupabaseRoute() {
  const jar: PendingCookie[] = [];
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          jar.push(cookie);
          try {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          } catch {
            /* The response seal below still sends them. */
          }
        }
      },
    },
  });
  return {
    supabase,
    seal<T extends NextResponse>(res: T): T {
      for (const cookie of jar) res.cookies.set(cookie.name, cookie.value, cookie.options);
      return res;
    },
  };
}

/** No session. Used for public catalog reads and secret-gated order writes. */
export function createSupabaseAnon() {
  return createClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
