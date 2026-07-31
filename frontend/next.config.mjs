import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
};

export default nextConfig;
