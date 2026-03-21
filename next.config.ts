import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Reduziert große lucide-Bundles; vermeidet mitunter fehlerhafte Chunks im Dev. */
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  /**
   * Nicht in Webpack-Vendor-Chunks packen — vermeidet MODULE_NOT_FOUND zu
   * `./vendor-chunks/@supabase.js` o. Ä. (v. a. Windows/Dev).
   * (lucide-react bewusst nicht: kollidiert mit Next-internem transpilePackages.)
   */
  serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],
  async redirects() {
    return [
      { source: "/projekte", destination: "/projects", permanent: false },
      { source: "/projekte/:path*", destination: "/projects/:path*", permanent: false },
      { source: "/settings/categories", destination: "/settings", permanent: false },
      { source: "/settings/labels", destination: "/settings", permanent: false },
    ];
  },
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/favicon.svg" }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
