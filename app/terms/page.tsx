import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
export default function Terms() {
  return (
    <PublicShell>
      <main className="vp-public-notice">
        <p className="vp-eyebrow">WELCOME TO VELAPAL</p>

        <h1>Smarter Commerce. Fairer Resolutions.</h1>

        <p>
          Experience a smarter way to shop, manage transactions, and resolve
          disputes. VelaPal brings customers, merchants, and AI-powered
          assistance together in one seamless platform.
        </p>

        <p>
          Workspace records and actions are provided by the VelaPal API. You
          review and authorize case decisions and financial actions. Features
          without a defined backend integration are unavailable.
        </p>

        <Link className="vp-link" href="/register">
          Explore VelaPal
        </Link>
      </main>
    </PublicShell>
  );
}
