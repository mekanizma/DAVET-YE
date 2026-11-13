"use client";

import InvitationExperience from "@/components/invitation/InvitationExperience";
import StageView from "@/components/stage/StageView";
import { getTheme } from "@/data/themes";
import type { Locale } from "@/i18n/locale";
import { emptyDraft, emptyInfo, type InvitationDraft } from "@/lib/storage";

export default function ShareInvitation({
  template,
  locale,
  stage,
  design,
}: {
  template: string;
  locale: Locale;
  stage: unknown;
  design: Record<string, unknown>;
}) {
  const theme = getTheme(template);
  const info = design.info && typeof design.info === "object" ? design.info as InvitationDraft["info"] : emptyInfo;
  const draft: InvitationDraft = {
    ...emptyDraft,
    event: (design.event as InvitationDraft["event"]) || null,
    template: template || null,
    languages: Array.isArray(design.languages) ? design.languages.filter((item): item is string => item === "tr" || item === "en") : ["tr"],
    info: { ...emptyInfo, ...info },
    program: Array.isArray(design.program) ? design.program as InvitationDraft["program"] : emptyDraft.program,
    hiddenSections: Array.isArray(design.hiddenSections) ? design.hiddenSections.filter((item): item is string => typeof item === "string") : [],
  };
  if (stage && theme) {
    return <StageView stage={stage as never} slug={template} locale={locale} guestDraft={draft} />;
  }
  if (!theme) return null;
  const mode = draft.event === "coklu" ? "kina-dugun" : "tek";
  return <InvitationExperience theme={theme} mode={mode} locale={locale} guestDraft={draft} />;
}
