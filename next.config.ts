import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "utfs.io", pathname: "/**" },
      { protocol: "https", hostname: "**.ufs.sh", pathname: "/**" },
    ],
    /**
     * Dev-only bypass for `/_next/image` server-side fetching.
     * On corporate networks (Zscaler / Netskope MITM), Node cannot validate
     * the Uploadthing CDN TLS chain and every optimized image returns 500
     * with UNABLE_TO_GET_ISSUER_CERT_LOCALLY. Production keeps optimization.
     */
    unoptimized: process.env.NODE_ENV !== "production",
    /** UploadThing / merchant uploads may include SVG (e.g. exports); required for `next/image`. */
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
