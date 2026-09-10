import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
const djangoOrigin = apiBase.replace(/\/api\/v1\/?$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Sortie autonome : image Docker légère (voir Dockerfile).
  output: "standalone",
  images: {
    // Autoriser plus tard les images servies par le backend Django (media).
    remotePatterns: [],
  },
  sassOptions: {
    includePaths: [path.join(__dirname)],
  },
  async rewrites() {
    if (!djangoOrigin) return [];

    return [
      {
        source: "/media/:path*",
        destination: `${djangoOrigin}/media/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${djangoOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
