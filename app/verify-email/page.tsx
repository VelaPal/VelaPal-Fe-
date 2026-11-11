"use client";
import Link from "next/link";
import { Mail } from "lucide-react";
import AuthLayout from "@/components/layout/auth-layout";
export default function VerifyPage() {
  return (
    <AuthLayout>
      <div className="vp-verify-icon">
        <Mail size={28} />
      </div>
      <div className="vp-auth-heading">
        <p className="vp-eyebrow">EMAIL VERIFICATION</p>
        <h1>Verify your email.</h1>
        <p>Verify ownership of your email before continuing.</p>
      </div>
      <div className="vp-auth-form">
        <p className="vp-verification-copy" role="status">
          Email verification is unavailable: the API contract does not define
          verification or resend endpoints.
        </p>
        <button className="vp-button" disabled>
          Verify email
        </button>
        <button className="vp-secondary" disabled>
          Resend verification link
        </button>
        <Link className="vp-link" href="/login">
          Back to sign in
        </Link>
      </div>
      <p className="vp-auth-disclosure">
        No verification email has been requested.
      </p>
    </AuthLayout>
  );
}
