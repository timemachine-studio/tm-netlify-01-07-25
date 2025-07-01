import { NextRequest, NextResponse } from 'next/server';

// This configuration specifies that the middleware should run for all paths.
export const config = {
  matcher: '/:path*',
};

// The middleware function that intercepts incoming requests.
export function middleware(request: NextRequest) {
  // Read the MAINTENANCE_MODE environment variable.
  // It will be 'true' if the environment variable is set to "true", otherwise 'false'.
  const maintenanceMode = process.env.VITE_MAINTENANCE_MODE === 'true';
  const url = request.nextUrl;

  // If maintenance mode is active AND the current request is not already for the maintenance page,
  // then redirect the user to the maintenance page.
  if (maintenanceMode && url.pathname !== '/maintenance.html') {
    url.pathname = '/maintenance.html';
    return NextResponse.redirect(url);
  }

  // If maintenance mode is off, or if the request is already for the maintenance page,
  // allow the request to proceed to the next handler (your application or the static maintenance.html).
  return NextResponse.next();
}