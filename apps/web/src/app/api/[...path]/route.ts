import { NextRequest, NextResponse } from "next/server";
import { callApi } from "@/lib/gateway";

export const dynamic = "force-dynamic";

const MAX_BODY = 1024 * 1024;

/** IP do usuário final. Na Vercel, x-vercel-forwarded-for é definido pela plataforma (o cliente não consegue forjar). */
function clientIp(req: NextRequest): string {
  const v = req.headers.get("x-vercel-forwarded-for") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  return v.slice(0, 64);
}

/**
 * Gateway: o navegador só conversa com este mesmo site. Aqui conferimos a origem, assinamos a chamada
 * e repassamos para a API na VPS. O cookie de sessão é do próprio site (HttpOnly) e nunca é lido pelo navegador.
 */
async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const method = req.method;

  if (method !== "GET" && method !== "HEAD") {
    const origin = req.headers.get("origin");
    if (origin) {
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
      let same = false;
      try { same = new URL(origin).host === host; } catch { /* origem inválida */ }
      if (!same) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
    }
  }

  let body = "";
  if (method !== "GET" && method !== "HEAD") {
    body = await req.text();
    if (body.length > MAX_BODY) return NextResponse.json({ error: "Requisição muito grande." }, { status: 413 });
  }

  const pathAndQuery = `/api/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;
  const res = await callApi({ method, pathAndQuery, ip: clientIp(req), body, cookie: req.headers.get("cookie"), contentType: req.headers.get("content-type") });

  const out = new NextResponse(res.body, { status: res.status });
  for (const h of ["content-type", "content-disposition"]) { const v = res.headers.get(h); if (v) out.headers.set(h, v); }
  for (const c of res.headers.getSetCookie?.() ?? []) out.headers.append("set-cookie", c);
  out.headers.set("cache-control", "no-store");
  return out;
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
