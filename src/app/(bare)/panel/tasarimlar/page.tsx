import type { Metadata } from "next";
import DraftCard from "@/components/panel/DraftCard";

export const metadata: Metadata = { title: "Tasarımlarım" };

export default function Page() {
  return (
    <div className="dash">
      <header className="dash__head">
        <div>
          <p className="eyebrow">Tasarımlarım</p>
          <h1>Davetiyeleriniz</h1>
          <p className="muted">Onaylanan siparişler hesabınızda durur. Yarım kalan tasarım bu cihazda taslak olarak görünür.</p>
        </div>
      </header>
      <DraftCard />
    </div>
  );
}
