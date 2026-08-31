import { notFound } from 'next/navigation';
import { isAdminPortalEnabled } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAdminPortalEnabled()) {
    notFound();
  }

  return <>{children}</>;
}
