"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { createAuthBrowserClient } from "@/shared/lib/supabase/auth-client";

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("://") ? value : "/dashboard";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const { error: authError } = await createAuthBrowserClient().auth.signInWithPassword({ email: email.trim(), password });
    if (authError) {
      setBusy(false);
      setError("Sign-in failed. Check your credentials or contact a platform administrator.");
      return;
    }
    router.replace(safeNext(params.get("next")));
    router.refresh();
  }

  async function google() {
    setBusy(true);
    setError("");
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", safeNext(params.get("next")));
    const { error: authError } = await createAuthBrowserClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo.toString() } });
    if (authError) { setBusy(false); setError("Google sign-in is temporarily unavailable."); }
  }

  return <main className="login-page">
    <section className="login-card">
      <span className="login-mark"><ShieldCheck size={27} /></span>
      <h1>Platform control</h1>
      <p className="lead">Sign in with an approved KOMOLA platform-admin account to manage operations and review platform health.</p>
      {params.get("error") === "admin_required" ? <p className="login-error" style={{ marginTop: 18 }}>This account is not registered as a platform administrator.</p> : null}
      {params.get("error") === "auth_callback" ? <p className="login-error" style={{ marginTop: 18 }}>The sign-in callback could not be completed. Please try again.</p> : null}
      <button className="secondary-button" style={{ width: "100%", marginTop: 24, minHeight: 44 }} type="button" onClick={() => void google()} disabled={busy}>Continue with Google</button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 0", color: "var(--muted)", fontSize: 11 }}><span style={{ height: 1, flex: 1, background: "var(--border)" }} /><span>or use email</span><span style={{ height: 1, flex: 1, background: "var(--border)" }} /></div>
      <form className="form-stack" onSubmit={submit}>
        <label className="form-label">Admin email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@komola.in" required /></label>
        <label className="form-label">Password<div style={{ position: "relative" }}><input style={{ width: "100%", paddingRight: 45 }} type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" className="icon-button" style={{ position: "absolute", right: 6, top: 5 }} onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></label>
        {error ? <p className="login-error">{error}</p> : null}
        <button className="primary-button" style={{ minHeight: 44 }} type="submit" disabled={busy}>{busy ? <Loader2 size={16} className="spin" /> : null}{busy ? "Signing in…" : "Sign in securely"}</button>
      </form>
      <p className="login-footnote">Access is controlled by the Go API and the platform-admin allowlist. Seller, buyer, and Rewardor accounts cannot enter this console.</p>
    </section>
  </main>;
}

export default function LoginPage() {
  return <Suspense fallback={<main className="login-page"><p>Loading sign-in…</p></main>}><LoginForm /></Suspense>;
}
