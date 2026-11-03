import type { NextConfig } from "next";

/**
 *   npm run build         Vercel.
 *   npm run build:static  Plain HTML in ./out for any web host.
 *
 * This is a private back office, not a shop front: every route is
 * noindex, and the static build exists so the whole thing can be handed
 * over as a folder and opened without a server.
 */
const isStatic = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  cacheComponents: !isStatic,
  partialPrefetching: !isStatic,
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },

  ...(isStatic
    ? { output: "export" as const, trailingSlash: true, images: { unoptimized: true } }
    : {
        images: { formats: ["image/avif" as const, "image/webp" as const] },
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
            },
          ];
        },
      }),
};

export default nextConfig;
