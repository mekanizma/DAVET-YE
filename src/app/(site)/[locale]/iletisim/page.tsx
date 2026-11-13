import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import ContentPage from "@/components/ContentPage";
import { isLocale, lp } from "@/i18n/locale";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  return pageMeta({
    title: en ? "Contact" : "İletişim",
    description: en
      ? "Write to Davetanisi for support or a suggestion. We will answer questions about digital invitations and wedding newspapers."
      : "Davetanisi destek ve önerileriniz için bize yazın. Dijital davetiye ve düğün gazetesi hakkında yanıtlayalım.",
    path: lp(locale, "/iletisim"),
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  return (
    <ContentPage
      eyebrow={en ? "Contact" : "İletişim"}
      title={en ? "Write to us" : "Bize yazın"}
      lead={en ? "Fill in the form for a question, a suggestion, or a request for help." : "Sorularınız, önerileriniz ya da destek talepleriniz için formu doldurun."}
    >
      <ContactForm />
      <p>
        {en ? (
          <>You can also read the <Link href={lp(locale, "/sss")}>frequently asked questions</Link>.</>
        ) : (
          <>Sık sorulan sorulara <Link href={lp(locale, "/sss")}>buradan</Link> bakabilirsiniz.</>
        )}
      </p>
    </ContentPage>
  );
}
