import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import ContentPage from "@/components/ContentPage";

import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "İletişim",
  description: "Davetanisi destek ve önerileriniz için bize yazın. Dijital davetiye ve düğün gazetesi hakkında yanıtlayalım.",
  path: "/tr/iletisim",
});

export default function Page() {
  return (
    <ContentPage
      eyebrow="İletişim"
      title="Bize yazın"
      lead="Sorularınız, önerileriniz ya da destek talepleriniz için formu doldurun."
    >
      <ContactForm />
      <p>
        Sık sorulan sorulara <Link href="/tr/sss">buradan</Link> bakabilirsiniz.
      </p>
    </ContentPage>
  );
}
