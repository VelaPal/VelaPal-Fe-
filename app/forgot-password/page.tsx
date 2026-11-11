"use client";
import Link from "next/link";
import AuthLayout from "@/components/layout/auth-layout";
export default function ForgotPassword() {
  return (
    <AuthLayout>
      <div className="vp-auth-heading">
        <p className="vp-eyebrow">ACCOUNT RECOVERY</p>
        <h1>A fresh start.</h1>
        <p>Request a password recovery link.</p>
      </div>
      <form className="vp-auth-form" onSubmit={(e) => e.preventDefault()}>
        <label className="vp-label">
          Email address
          <input
            className="vp-input"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </label>
        <button className="vp-button" disabled>
          Send recovery email
        </button>
      </form>
      <p className="vp-auth-disclosure" role="status">
        Password recovery is unavailable: the API contract does not define this
        endpoint.
      </p>
      <Link className="vp-link" href="/login">
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
