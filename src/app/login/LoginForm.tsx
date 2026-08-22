'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldReduceMotion = useReducedMotion();
  const yOffset = shouldReduceMotion ? 0 : 12;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.06,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' as const },
    },
  };

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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {error && (
        <motion.div 
          variants={itemVariants}
          className="p-4 rounded-sm bg-danger-bg border border-danger-border text-danger text-xs font-semibold"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <motion.div variants={itemVariants}>
          <label className="label-premium">
            Email Address
          </label>
          <input
            type="email"
            required
            className="input-premium"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="donor@foodops.org"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="label-premium">
            Password
          </label>
          <input
            type="password"
            required
            className="input-premium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
            className="btn-primary w-full py-3 shadow-md shadow-primary/10 transition-shadow"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </motion.button>
        </motion.div>
      </form>

      {/* Demo shortcuts */}
      <motion.div variants={itemVariants} className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface px-2.5 text-muted-light font-bold tracking-widest">
            Demo Credentials
          </span>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants} 
        className="flex flex-wrap gap-2 justify-center"
      >
        {[
          { email: 'donor@foodops.org', label: '🏨 Donor' },
          { email: 'ngo1@foodops.org', label: '🌍 NGO A' },
          { email: 'ngo2@foodops.org', label: '🌍 NGO B' },
          { email: 'ngo_pending@foodops.org', label: '⏳ NGO C' },
          { email: 'volunteer@foodops.org', label: '🚴 Volunteer' },
          { email: 'admin@foodops.org', label: '🛡️ Admin' },
        ].map((demo) => (
          <motion.button
            key={demo.email}
            type="button"
            onClick={() => handleDemoLogin(demo.email)}
            whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -1 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            className="btn-secondary rounded-full text-[11px] px-3.5 py-1.5"
          >
            {demo.label}
          </motion.button>
        ))}
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="text-center text-sm text-muted-text pt-4 border-t border-border"
      >
        New to FoodOps?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create Account
        </Link>
      </motion.div>
    </motion.div>
  );
}
