const isProd = process.env.NODE_ENV === "production";
/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next", // permite compilar em outra pasta sem afetar um servidor em execução
  serverExternalPackages: ["better-sqlite3"],
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
