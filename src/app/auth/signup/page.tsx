'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      // Redirect to dashboard after successful signup
      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-md px-4 py-24 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Sign up</h1>
        <p className="mt-2 text-sm text-ink-secondary">Create an account to get started</p>

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded border border-base-border bg-base-surface px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="mt-1 w-full rounded border border-base-border bg-base-surface px-3 py-2 text-sm"
              required
            />
          </div>

          {error && <div className="rounded bg-signal-down/10 p-3 text-sm text-signal-down">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-pill bg-rupee px-5 py-2.5 text-sm font-semibold text-black hover:bg-rupee-bright disabled:opacity-50"
          >
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-secondary">
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
