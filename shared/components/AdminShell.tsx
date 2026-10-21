"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, AlertTriangle, BarChart3, Boxes, Building2, ChevronRight, Download, FileClock, Gift, Globe2, LayoutDashboard, LineChart, LogOut, Menu, PackageSearch, ShieldAlert, ShieldCheck, UserRoundCog, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { adminBootstrap, clearAdminBootstrapCache, type AdminBootstrap } from "@/shared/lib/api/admin";
import { createAuthBrowserClient } from "@/shared/lib/supabase/auth-client";
import { ErrorNotice } from "@/shared/components/AdminPrimitives";

const coreNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/organizations", label: "Organizations", icon: Building2 },
  { href: "/buyers", label: "Buyers", icon: Users },
  { href: "/locations", label: "Locations", icon: Globe2 },
  { href: "/privacy", label: "Privacy operations", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/operations", label: "Operations", icon: Boxes },
  { href: "/reconciliation", label: "Reconciliation", icon: AlertTriangle },
  { href: "/audit", label: "Audit log", icon: FileClock },
  { href: "/alerts", label: "Alerts", icon: ShieldAlert },
  { href: "/fraud", label: "Fraud signals", icon: ShieldAlert },
  { href: "/exports", label: "Exports", icon: Download },
  { href: "/performance", label: "Performance", icon: LineChart },
  { href: "/inventory", label: "Inventory analytics", icon: PackageSearch },
  { href: "/freshness", label: "Data health", icon: Activity },
  { href: "/rewardor-rewards", label: "Rewardor rewards", icon: Gift },
];

function initials(value: string) { return value.split(/[ @]/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "KA"; }

export default function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const initialPathname = useRef(pathname);
  const [bootstrap, setBootstrap] = useState<AdminBootstrap | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const [error, setError] = useState("");
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    adminBootstrap({ signal: controller.signal }).then((result) => {
      if (!active) return;
      if (result.status === 401) { router.replace(`/login?next=${encodeURIComponent(initialPathname.current)}`); return; }
      if (!result.success || !result.data) { setError(result.message || "Platform-admin access could not be verified."); setState("error"); return; }
      if (result.status === 403 || result.data.user?.role !== "Admin") { setState("denied"); return; }
      setBootstrap(result.data);
      setState("ready");
    }).catch(() => {
      if (!active) return;
      setError("Platform-admin access could not be verified. Please try again.");
      setState("error");
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [router, verificationAttempt]);

  async function signOut() {
    clearAdminBootstrapCache();
    await createAuthBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (state === "loading") return <div className="login-page"><div className="card" style={{ width: "min(100%, 430px)", textAlign: "center" }}><span className="login-mark" style={{ margin: "0 auto" }}><ShieldCheck size={27} /></span><p style={{ margin: "17px 0 0", color: "var(--muted)", fontSize: 13 }}>Verifying platform-admin access…</p></div></div>;
  if (state === "denied") return <div className="login-page"><div className="card" style={{ width: "min(100%, 480px)", textAlign: "center" }}><span className="login-mark" style={{ margin: "0 auto", background: "var(--danger)" }}><ShieldCheck size={27} /></span><h1 style={{ margin: "18px 0 0", color: "var(--primary-strong)", fontSize: 26, fontWeight: 900 }}>Platform access required</h1><p style={{ margin: "10px 0 0", color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>Your identity is valid, but it is not in the platform-admin allowlist.</p><button className="secondary-button" style={{ marginTop: 22 }} onClick={() => void signOut()}>Sign out</button></div></div>;
  if (state === "error") return <div className="login-page"><div className="card" style={{ width: "min(100%, 480px)" }}><span className="login-mark" style={{ margin: "0 auto" }}><ShieldCheck size={27} /></span><h1 style={{ margin: "18px 0 0", color: "var(--primary-strong)", fontSize: 26, fontWeight: 900, textAlign: "center" }}>Access check unavailable</h1><div style={{ marginTop: 18 }}><ErrorNotice message={error} /></div><button className="primary-button" style={{ marginTop: 18, width: "100%" }} onClick={() => { setError(""); setState("loading"); setVerificationAttempt((attempt) => attempt + 1); }}>Try again</button></div></div>;

  const email = bootstrap?.user?.email ?? "Platform administrator";
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="admin-brand"><span className="brand-mark">K</span><div><div className="brand-name">KOMOLA</div><div className="brand-subtitle">Platform control</div></div></div>
      <nav className="admin-nav"><div className="nav-label">Control centre</div>{coreNav.map((item) => { const Icon = item.icon; const active = pathname === item.href || pathname.startsWith(`${item.href}/`); return <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`}><Icon size={17} /><span>{item.label}</span></Link>; })}<div className="nav-label" style={{ marginTop: 26 }}>Product surfaces</div><span className="nav-link pending"><UserRoundCog size={17} /><span>Rewardor controls</span><span style={{ marginLeft: "auto", fontSize: 9 }}>API next</span></span><span className="nav-link pending"><ChevronRight size={17} /><span>POS operations</span><span style={{ marginLeft: "auto", fontSize: 9 }}>API next</span></span></nav>
      <div className="sidebar-foot"><p style={{ color: "var(--primary-strong)", fontSize: 12, fontWeight: 900 }}>Protected workspace</p><p className="caption" style={{ marginTop: 6 }}>Every admin decision is enforced and audited by the Go API.</p></div>
    </aside>
    <div className={`mobile-nav ${mobileMenuOpen ? "open" : ""}`} aria-hidden={!mobileMenuOpen}>
      <div className="mobile-nav-head"><strong>Control centre</strong><button className="icon-button" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation"><X size={17} /></button></div>
      <div className="mobile-nav-links">{coreNav.map((item) => { const Icon = item.icon; const active = pathname === item.href || pathname.startsWith(`${item.href}/`); return <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`nav-link ${active ? "active" : ""}`}><Icon size={17} /><span>{item.label}</span></Link>; })}</div>
    </div>
    {mobileMenuOpen && <button className="mobile-nav-backdrop" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" />}
    <main className="admin-main"><header className="admin-topbar"><div className="topbar-heading"><div><div className="topbar-kicker">KOMOLA / Admin</div><div className="topbar-title">Platform operations</div></div><button className="icon-button mobile-menu-toggle" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation"><Menu size={18} /></button></div><div className="admin-user"><span className="avatar">{initials(email)}</span><span className="user-email">{email}</span><button className="icon-button" onClick={() => void signOut()} aria-label="Sign out"><LogOut size={15} /></button></div></header><div className="admin-content">{children}</div></main>
  </div>;
}
