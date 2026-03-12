import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: self + Next.js inline scripts + Google Fonts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles: self + inline (Tailwind) + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + Supabase storage + data URIs
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
              // XHR/fetch: self + Supabase
              "connect-src 'self' https://*.supabase.co https://*.supabase.in",
              // No plugins/objects
              "object-src 'none'",
              // No embedding by other sites
              "frame-ancestors 'none'",
              // No frame/iframe loading from external
              "frame-src 'none'",
              // Prevent base-tag hijacking
              "base-uri 'self'",
              // Force HTTPS for all form submissions
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
