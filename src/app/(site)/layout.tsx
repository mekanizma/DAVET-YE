import CookieBanner from "@/components/CookieBanner";
import SiteFooter from "@/components/SiteFooter";
import SiteFrame from "@/components/SiteFrame";
import SiteHeader, { type HeaderAccount } from "@/components/SiteHeader";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServer } from "@/lib/supabase/server";

async function headerAccount(): Promise<HeaderAccount> {
  if (!supabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const raw = user.user_metadata?.full_name;
    return { name: typeof raw === "string" ? raw.trim() : "" };
  } catch {
    return null;
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const account = await headerAccount();
  return (
    <SiteFrame
      header={<SiteHeader account={account} />}
      footer={<SiteFooter />}
      banner={<CookieBanner />}
    >
      {children}
    </SiteFrame>
  );
}
