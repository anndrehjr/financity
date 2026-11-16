import path from "node:path";
import { fileURLToPath } from "node:url";

const isProd = process.env.NODE_ENV === "production";
const raizDoRepo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // monorepo: o site usa packages/gateway-sign, que fica fora de apps/web; o rastreio de arquivos parte da raiz do repositório
  outputFileTracingRoot: raizDoRepo,
  transpilePackages: ["@financity/gateway-sign"],
  poweredByHeader: false,
  async headers() {
    const h = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "same-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    if (isProd) h.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
    return [{ source: "/:path*", headers: h }];
  },
};
export default nextConfig;
