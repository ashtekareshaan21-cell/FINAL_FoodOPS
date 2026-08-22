import LoginForm from './LoginForm';
import Navbar from '@/components/Navbar';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';

export default function LoginPage() {
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
