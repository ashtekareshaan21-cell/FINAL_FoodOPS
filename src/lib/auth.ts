import { cookies } from 'next/headers';
import * as crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production.');
}
const effectiveSecret = JWT_SECRET || 'fallback_secret_for_foodops';

interface JWTPayload {
  userId: string;
  role: string;
  email: string;
  verificationStatus?: string;
  accountStatus?: string;
  exp: number;
}

function base64UrlEncode(input: Buffer | string): string {
  const buffer = typeof input === 'string' ? Buffer.from(input) : input;
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString();
}

// Long-lived persistent session duration (1 year in seconds) so the user stays logged in until explicit sign out
export const SESSION_MAX_AGE_SECONDS = 365 * 24 * 60 * 60; // 31,536,000s (1 year)

export function signToken(payload: Omit<JWTPayload, 'exp'>, expiresInSeconds = SESSION_MAX_AGE_SECONDS): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', effectiveSecret)
    .update(signatureInput)
    .digest();
  
  const encodedSignature = base64UrlEncode(signature);

  return `${signatureInput}.${encodedSignature}`;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = base64UrlEncode(
      crypto
        .createHmac('sha256', effectiveSecret)
        .update(signatureInput)
        .digest()
    );

    if (encodedSignature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSession(payload: Omit<JWTPayload, 'exp'>) {
  const token = signToken(payload, SESSION_MAX_AGE_SECONDS);
  const cookieStore = await cookies();
  const expiresDate = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires: expiresDate,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  try {
    cookieStore.delete('session');
  } catch {
    // Ignore in read-only contexts
  }
  try {
    cookieStore.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
  } catch {
    // Ignore in read-only contexts
  }
}

export function isAdminPortalEnabled(): boolean {
  return process.env.ADMIN_PORTAL_ENABLED === 'true';
}
