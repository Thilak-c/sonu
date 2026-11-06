import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

const VALID_USERS = ['8008', '9122'];

export async function GET(request) {
  const cookie = request.cookies.get('sonu_admin_user')?.value;
  if (cookie && VALID_USERS.includes(cookie)) {
    return NextResponse.json({ authenticated: true, user: cookie });
  }
  return NextResponse.json({ authenticated: false, user: null });
}

export async function POST(request) {
  // 1. Guard against brute force attacks: max 5 attempts per 15 minutes per IP
  const blockedResponse = rateLimit(request, 'admin_login', {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (blockedResponse) return blockedResponse;

  try {
    const body = await request.json().catch(() => ({}));
    const code = (body.code || body.user || body.pin || '').toString().trim();

    if (!VALID_USERS.includes(code)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user code. Only 8008 and 9122 are authorized.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: code,
      message: `Welcome back, User ${code}`,
    });

    // Set persistent session cookie (30 days)
    response.cookies.set({
      name: 'sonu_admin_user',
      value: code,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false, // Accessible to client scripts for UI state
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Login request failed' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Signed out successfully' });
  response.cookies.delete('sonu_admin_user');
  return response;
}

