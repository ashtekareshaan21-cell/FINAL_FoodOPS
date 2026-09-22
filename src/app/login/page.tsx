export const dynamic = 'force-dynamic';

import LoginForm from './LoginForm';
import Navbar from '@/components/Navbar';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    if (session.role === 'DONOR') redirect('/donor');
    if (session.role === 'NGO') redirect('/ngo');
    if (session.role === 'VOLUNTEER') redirect('/volunteer');
    if (session.role === 'ADMIN') redirect('/admin');
    redirect('/');
  }
  return (
    <div className="min-h-screen bg-transparent flex flex-col relative">
      <FoodOpsBackground variant="auth" />
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-surface/75 backdrop-blur-md p-8 rounded-2xl border border-border shadow-lg">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-foreground">
              Sign in to FoodOps
            </h2>
            <p className="mt-2 text-center text-sm text-muted-text">
              Enter your credentials to continue
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
