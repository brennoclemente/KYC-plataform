import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Protect /admin/* — ADMIN only
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    // Protect /onboarding/* — any authenticated user
    if (pathname.startsWith('/onboarding')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        // Allow the middleware function to run for all matched routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/onboarding/:path*'],
};
