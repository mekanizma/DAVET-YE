import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = { title: "İletişim" };

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
