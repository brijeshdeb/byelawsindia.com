import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enforce strict mode for React
  reactStrictMode: true,

  // Remove the X-Powered-By: Next.js disclosure header
  poweredByHeader: false,

  // Security headers — applied to every response
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent framing from any origin (belt-and-suspenders with CSP frame-ancestors)
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Content Security Policy
          // Note: Next.js App Router requires 'unsafe-inline' for its inline hydration
          // scripts. Migrate to nonce-based CSP once Next.js nonce support is wired up.
          // 'unsafe-eval' is required by Next.js dev and some production edge cases.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' blob: data: https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Image domains — only permit Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },

  // Experimental: enable server actions (stable in Next.js 15)
  experimental: {
    // typedRoutes: true, // Enable when all routes are typed
  },
};

export default nextConfig;
