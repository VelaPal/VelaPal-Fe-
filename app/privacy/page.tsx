import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
export default function Privacy() {
  return (
    <PublicShell>
      <main className="vp-public-notice">
        <p className="vp-eyebrow">PRIVACY</p>
        <h1>Privacy notice</h1>
        <p>
          Sign-in credentials are sent to the VelaPal API. Sessions use an
          HttpOnly cookie; session tokens are not stored in browser storage.
          Registration and email verification are currently unavailable.
        </p>
        <p>
          Evidence uploads start private and require backend access checks.
          Review the audience before sharing. Closing a browser tab does not
          sign you out; use Sign out to revoke the server session.
        </p>
        <Link className="vp-link" href="/register">
          Back to create account
        </Link>
      </main>
    </PublicShell>
  );
}
