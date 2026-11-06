import { NextResponse } from 'next/server';

const VALID_USERS = ['8008', '9122'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow static assets, public assets, and api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/Font') ||
    pathname.startsWith('/Logo') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const userCookie = request.cookies.get('sonu_admin_user')?.value;
  const isAuthenticated = userCookie && VALID_USERS.includes(userCookie);

  // If on login page and already authenticated -> redirect to /orders
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/orders', request.url));
    }
    return NextResponse.next();
  }

  // If not authenticated -> redirect to /login
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

