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

  const handleDemoLogin = async (demoEmail: string, demoPassword = 'password') => {
    setLoading(true);
    setError(null);
    setEmail(demoEmail);
    setPassword(demoPassword);

    const res = await login({ email: demoEmail, password: demoPassword });
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
      setError(res.error || 'Demo login failed.');
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
            Username / Email Address
          </label>
          <input
            type="text"
            required
            className="input-premium"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ADMIN_FOODOPS or email"
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
            className="btn-primary w-full py-3 shadow-md shadow-primary/10 transition-shadow cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </motion.button>
        </motion.div>
      </form>

      {/* One-Tap Demo Logins */}
      <motion.div variants={itemVariants} className="pt-2 border-t border-border space-y-3">
        <div className="flex justify-between items-center text-[11px] font-bold text-muted uppercase tracking-wider">
          <span>One-Tap Demo Sign In</span>
          <span className="text-[10px] font-normal text-muted-light">Instant Access</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDemoLogin('donor@foodops.org')}
            className="p-2.5 rounded border border-border bg-surface hover:bg-surface-muted hover:border-primary/40 font-semibold text-foreground flex items-center gap-2 cursor-pointer transition-colors text-left"
          >
            <span>🏨</span>
            <div className="min-w-0">
              <div className="truncate font-bold">Donor</div>
              <div className="text-[10px] text-muted-light truncate">donor@foodops.org</div>
            </div>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleDemoLogin('ngo1@foodops.org')}
            className="p-2.5 rounded border border-border bg-surface hover:bg-surface-muted hover:border-primary/40 font-semibold text-foreground flex items-center gap-2 cursor-pointer transition-colors text-left"
          >
            <span>🌍</span>
            <div className="min-w-0">
              <div className="truncate font-bold">NGO (Verified)</div>
              <div className="text-[10px] text-muted-light truncate">ngo1@foodops.org</div>
            </div>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleDemoLogin('volunteer@foodops.org')}
            className="p-2.5 rounded border border-border bg-surface hover:bg-surface-muted hover:border-primary/40 font-semibold text-foreground flex items-center gap-2 cursor-pointer transition-colors text-left"
          >
            <span>🚴</span>
            <div className="min-w-0">
              <div className="truncate font-bold">Volunteer Rider</div>
              <div className="text-[10px] text-muted-light truncate">volunteer@foodops.org</div>
            </div>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleDemoLogin('ADMIN_FOODOPS', 'admin@123')}
            className="p-2.5 rounded border border-border bg-surface hover:bg-surface-muted hover:border-primary/40 font-semibold text-foreground flex items-center gap-2 cursor-pointer transition-colors text-left"
          >
            <span>🛡️</span>
            <div className="min-w-0">
              <div className="truncate font-bold">Admin Portal</div>
              <div className="text-[10px] text-muted-light truncate">ADMIN_FOODOPS</div>
            </div>
          </button>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="text-center text-sm text-muted-text pt-2"
      >
        New to FoodOps?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create Account
        </Link>
      </motion.div>
    </motion.div>
  );
}
