import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { isAdminPortalEnabled } from '@/lib/auth';
import { isLocalhostHeader } from '@/lib/adminGate';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const isLocalDev =
    process.env.NODE_ENV === 'development' &&
    isLocalhostHeader(
      reqHeaders.get('host'),
      reqHeaders.get('x-forwarded-host')
    );

  if (!isAdminPortalEnabled() || !isLocalDev) {
    notFound();
  }

  return <>{children}</>;
}
