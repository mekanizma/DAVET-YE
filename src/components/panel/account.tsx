"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { PanelAccount } from "@/lib/panelAccount";

export type Account = PanelAccount;

interface AccountState {
  account: Account | null;
  failed: boolean;
}

const AccountContext = createContext<AccountState>({ account: null, failed: false });

export function AccountProvider({ children, initial = null }: { children: React.ReactNode; initial?: Account | null }) {
  const [account, setAccount] = useState<Account | null>(initial);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (initial) return;
    let stop = false;
    fetch("/api/hesap", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          const next = window.location.pathname;
          window.location.assign(`/panel/giris?next=${encodeURIComponent(next)}`);
          return null;
        }
        if (!res.ok) throw new Error("account");
        return (await res.json()) as Account;
      })
      .then((data) => {
        if (!stop && data) setAccount(data);
      })
      .catch(() => {
        if (!stop) setFailed(true);
      });
    return () => {
      stop = true;
    };
  }, [initial]);

  return <AccountContext.Provider value={{ account, failed }}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  return useContext(AccountContext);
}
