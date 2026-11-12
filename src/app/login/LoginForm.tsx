'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { login, demoLogin } from '@/app/actions/auth';

const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const DemoSignInPanel = IS_DEMO_MODE
  ? dynamic(() => import('./DemoSignInPanel'), { ssr: false })
  : null;

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigateByRole = (role?: string | null) => {
    if (role === 'DONOR') {
      router.push('/donor');
    } else if (role === 'NGO') {
      router.push('/ngo');
    } else if (role === 'VOLUNTEER') {
      router.push('/volunteer');
    } else if (role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/');
    }
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await login({ email, password });
    setLoading(false);

    if (res.success) {
      navigateByRole(res.role);
    } else {
      setError(res.error || 'Authentication failed.');
    }
  };

  const handleDemoLogin = async (sampleEmail: string) => {
    if (!IS_DEMO_MODE) return;
    setLoading(true);
    setError(null);
    setEmail(sampleEmail);

    const res = await demoLogin(sampleEmail);
    setLoading(false);

    if (res.success) {
      navigateByRole(res.role);
    } else {
      setError(res.error || 'Sample sign-in failed.');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="p-4 rounded-sm bg-danger-bg border border-danger-border text-danger text-xs font-semibold"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="label-premium">
            Email Address
          </label>
          <input
            id="login-email"
            name="email"
            type="text"
            autoComplete="username"
            required
            className="input-premium"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@organisation.org"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="label-premium">
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input-premium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 shadow-md shadow-primary/10 transition-all cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </form>

      {IS_DEMO_MODE && DemoSignInPanel ? (
        <DemoSignInPanel loading={loading} onDemoLogin={handleDemoLogin} />
      ) : null}

      <div className="text-center text-sm text-muted-text pt-2">
        New to FoodOPS?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Register your organisation
        </Link>
      </div>
    </div>
  );
}
