import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

// Allowlist for Clerk (email + Google sign-in), Cloudflare Turnstile (Clerk bot
// protection), and Google Identity. Shipped as Report-Only first: a missing host is
// logged in the browser console instead of breaking auth. After verifying there are no
// violations, rename the header key to 'Content-Security-Policy' to enforce.
// If your prod Clerk Frontend API host appears in violations, add it explicitly, e.g.
//   https://clerk.your-domain.com
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://accounts.google.com https://apis.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://accounts.google.com https://*.google.com",
  "frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com https://accounts.google.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy-Report-Only', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // HSTS only in production (never send over http on localhost).
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
