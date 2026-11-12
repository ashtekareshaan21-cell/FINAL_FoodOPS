function extractHostname(hostHeader: string | null): string {
  if (!hostHeader) return '';
  const first = hostHeader.split(',')[0]?.trim().toLowerCase() || '';
  if (!first || first.startsWith('[')) {
    return '';
  }
  return first.split(':')[0] || '';
}

export function isLocalhostHeader(
  host: string | null,
  forwardedHost: string | null = null
): boolean {
  const hostname = extractHostname(host);
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return false;
  }
  if (forwardedHost) {
    const fwdHostname = extractHostname(forwardedHost);
    if (fwdHostname !== 'localhost' && fwdHostname !== '127.0.0.1') {
      return false;
    }
  }
  return true;
}

export async function isLocalhostDevAdmin(): Promise<boolean> {
  if (process.env.ADMIN_PORTAL_ENABLED !== 'true') {
    return false;
  }
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  try {
    const { headers } = await import('next/headers');
    const reqHeaders = await headers();
    return isLocalhostHeader(
      reqHeaders.get('host'),
      reqHeaders.get('x-forwarded-host')
    );
  } catch {
    return false;
  }
}
