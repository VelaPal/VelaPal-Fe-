"use client";
import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/layout/auth-layout";
import PasswordField from "@/components/ui/password-field";
export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  return (
    <AuthLayout>
      <div className="vp-auth-heading">
        <p className="vp-eyebrow">ACCOUNT RECOVERY</p>
        <h1>Choose a new password.</h1>
        <p>Reset links are short-lived and can only be used once.</p>
      </div>
      <form className="vp-auth-form" onSubmit={(e) => e.preventDefault()}>
        <PasswordField
          id="reset-password"
          label="New password"
          value={password}
          onChange={setPassword}
        />
        <PasswordField
          id="reset-confirm"
          label="Confirm password"
          value={confirm}
          onChange={setConfirm}
        />
        <button className="vp-button" disabled>
          Reset password
        </button>
      </form>
      <p className="vp-auth-disclosure" role="status">
        Password reset is unavailable: the API contract does not define this
        endpoint. No credential has been changed.
      </p>
      <Link className="vp-link" href="/forgot-password">
        Request another link
      </Link>
    </AuthLayout>
  );
}
