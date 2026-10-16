/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Restrict formats to WebP only to avoid dual AVIF + WebP duplicate transformations on Vercel
    formats: ['image/webp'],
    // Cache transformed images at Vercel Edge for 31 days (2678400s) instead of the Next.js default 60s
    minimumCacheTTL: 2678400,
    // Streamline device breakpoints to match actual responsive layout needs
    deviceSizes: [640, 768, 1024, 1280, 1920],
    // Standardize fixed image/icon sizes to eliminate duplicate width variants
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Standardize allowed quality to 75 to reject arbitrary quality parameter transformations
    qualities: [75],
    // Disallow arbitrary remote hosts to prevent proxying and transformation attacks
    remotePatterns: [],
    // SVGs are served directly as vector assets without raster transformations
    dangerouslyAllowSVG: false,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;",
  },
};

module.exports = nextConfig;
