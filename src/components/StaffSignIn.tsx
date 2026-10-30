import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { ErrorState } from "./States";

export interface StaffSession {
  id: string;
  email: string;
}

interface StaffSignInProps {
  onSignedIn: (session: StaffSession) => void;
}

/** Email + password sign-in form for staff.  Shown when not authenticated. */
export function StaffSignIn({ onSignedIn }: StaffSignInProps) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        { email: email.trim(), password },
      );
      if (authError || !data.session || !data.user) {
        setError(t("staff.signIn.error.default"));
        return;
      }
      // Verify role from user metadata.
      const role = (data.user.app_metadata as Record<string, unknown>)?.role;
      if (role !== "staff") {
        // Sign out immediately — the account exists but lacks the staff role.
        await supabase.auth.signOut();
        setError(t("staff.signIn.error.forbidden"));
        return;
      }
      onSignedIn({ id: data.user.id, email: data.user.email ?? email.trim() });
    } catch {
      setError(t("staff.signIn.error.default"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto mt-10 max-w-sm rounded border border-border bg-card p-8">
      <h2 className="font-display text-xl font-semibold mb-6">
        {t("staff.signIn.heading")}
      </h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <label className="block text-sm">
          {t("staff.signIn.email")}
          <input
            type="email"
            autoComplete="username"
            required
            disabled={busy}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded border border-input bg-background px-3 py-2 text-foreground"
          />
        </label>
        <label className="block text-sm">
          {t("staff.signIn.password")}
          <input
            type="password"
            autoComplete="current-password"
            required
            disabled={busy}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded border border-input bg-background px-3 py-2 text-foreground"
          />
        </label>
        {error && <ErrorState>{error}</ErrorState>}
        <button
          type="submit"
          disabled={busy || !email.trim() || !password}
          className="w-full rounded bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy ? t("staff.signIn.submitting") : t("staff.signIn.submit")}
        </button>
      </form>
    </section>
  );
}

interface StaffBadgeProps {
  session: StaffSession;
  onSignOut: () => void;
}

/** Compact signed-in badge with sign-out button. */
export function StaffSignedInBadge({ session, onSignOut }: StaffBadgeProps) {
  const t = useT();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setBusy(false);
      onSignOut();
    }
  }

  return (
    <div className="flex items-center gap-3 rounded border border-border bg-muted px-4 py-2 text-sm">
      <span>
        {t("staff.signedIn.badge")}{" "}
        <span className="font-medium">{session.email}</span>
      </span>
      <button
        onClick={handleSignOut}
        disabled={busy}
        className="rounded border border-input px-3 py-1 text-xs hover:bg-background disabled:opacity-50"
      >
        {t("staff.signedIn.signOut")}
      </button>
    </div>
  );
}
