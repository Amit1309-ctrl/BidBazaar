"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createBrowserSupabase();
    const { error: signinError } = await supabase.auth.signInWithPassword({ email, password });

    if (signinError) {
      setError(signinError.message);
      setLoading(false);
      return;
    }

    router.push(searchParams.get("next") === "/admin" ? "/admin" : "/dashboard");
    router.refresh();
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-md px-4 py-24 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-ink-secondary">Sign in to manage your listing and dashboard.</p>

        <form onSubmit={handleSignin} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded border border-base-border bg-base-surface px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded border border-base-border bg-base-surface px-3 py-2 text-sm" />
          </label>

          {error && <div className="rounded bg-signal-down/10 p-3 text-sm text-signal-down">{error}</div>}

          <button type="submit" disabled={loading} className="w-full rounded-pill bg-rupee px-5 py-2.5 text-sm font-semibold text-black hover:bg-rupee-bright disabled:opacity-50">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-secondary">
          Don&apos;t have an account? <Link href="/auth/signup" className="font-semibold hover:underline">Sign up</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
