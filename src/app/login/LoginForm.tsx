'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';
import Link from 'next/link';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await login({ email, password });
    setLoading(false);

    if (res.success) {
      if (res.role === 'DONOR') {
        router.push('/donor');
      } else if (res.role === 'NGO') {
        router.push('/ngo');
      } else if (res.role === 'VOLUNTEER') {
        router.push('/volunteer');
      } else if (res.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
      router.refresh();
    } else {
      setError(res.error || 'Authentication failed.');
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setError(null);
    setEmail(demoEmail);
    setPassword('password');

    const res = await login({ email: demoEmail, password: 'password' });
    setLoading(false);

    if (res.success) {
      if (res.role === 'DONOR') {
        router.push('/donor');
      } else if (res.role === 'NGO') {
        router.push('/ngo');
      } else if (res.role === 'VOLUNTEER') {
        router.push('/volunteer');
      } else if (res.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
      router.refresh();
    } else {
      setError(`Demo account not seeded yet. Run the database seed script first.`);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. donor@foodops.org"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </form>

      {/* Demo shortcuts */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500 dark:text-zinc-400 font-semibold">
            Demo Accounts (One-Click)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleDemoLogin('donor@foodops.org')}
          className="px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors text-left"
        >
          🏨 Donor (Banquet Hall)
        </button>
        <button
          type="button"
          onClick={() => handleDemoLogin('ngo1@foodops.org')}
          className="px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors text-left"
        >
          🌍 NGO A (Verified, 10km)
        </button>
        <button
          type="button"
          onClick={() => handleDemoLogin('ngo2@foodops.org')}
          className="px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors text-left"
        >
          🌍 NGO B (Verified, 10km)
        </button>
        <button
          type="button"
          onClick={() => handleDemoLogin('ngo_pending@foodops.org')}
          className="px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors text-left"
        >
          ⏳ NGO C (Pending Review)
        </button>
        <button
          type="button"
          onClick={() => handleDemoLogin('volunteer@foodops.org')}
          className="px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors text-left"
        >
          🚴 Volunteer (Rider A)
        </button>
        <button
          type="button"
          onClick={() => handleDemoLogin('admin@foodops.org')}
          className="px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors text-left"
        >
          🛡️ Admin Coordinator
        </button>
      </div>

      <div className="text-center text-sm text-zinc-600 dark:text-zinc-400 pt-4">
        New to FoodOps?{' '}
        <Link href="/register" className="font-semibold text-emerald-600 hover:underline">
          Create Account
        </Link>
      </div>
    </div>
  );
}
