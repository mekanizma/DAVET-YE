"use client";

import { createContext, useContext } from "react";
import type { InvitationStyle } from "@/data/invitationStyles";
import type { Theme } from "@/data/themes";

export interface InvData {
  partnerA: string;
  partnerB: string;
  brideFamily: string;
  groomFamily: string;
  date: Date;
  /** Kına evening (day before) when mode is kina-dugun */
  kinaDate: Date | null;
  venue: string;
  address: string;
  message: string;
  familyMessage: string;
  program: { time: string; title: string; text: string }[];
  iban: string;
  ibanHolder: string;
  closing: string;
}

export interface IvCtxValue {
  theme: Theme;
  style: InvitationStyle;
  data: InvData;
  embed: boolean;
  reduced: boolean;
  /** which sections to render (ids from data/sections) */
  hidden: Set<string>;
}

const Ctx = createContext<IvCtxValue | null>(null);
export const IvProvider = Ctx.Provider;
export function useIv(): IvCtxValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useIv outside provider");
  return v;
}
