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
    // Content-Security-Policy: segunda barreira contra XSS. Tudo é do próprio site (inclusive os áudios da Nina e as fontes);
    // 'unsafe-inline' é necessário para os scripts de hidratação do Next e para os estilos do Tailwind (não há nonce).
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "font-src 'self' data:",
      `connect-src 'self'${isProd ? "" : " ws: wss:"}`,
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join("; ");
    const h = [
      { key: "Content-Security-Policy", value: csp },
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
