import { NextResponse } from "next/server";
import { HttpError, checkOrigin } from "./auth";

type Handler<A extends unknown[]> = (...args: A) => Promise<unknown>;

/** Envolve um handler de rota: valida origem em métodos de escrita e converte erros em JSON. */
export function api<A extends [Request, ...unknown[]]>(fn: Handler<A>) {
  return async (...args: A) => {
    try {
      if (!["GET", "HEAD"].includes(args[0].method)) await checkOrigin();
      const out = await fn(...args);
      if (out instanceof Response) return out;
      return NextResponse.json(out ?? { ok: true }, { headers: { "Cache-Control": "no-store" } });
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error(e);
      return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
    }
  };
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try { return (await req.json()) as T; } catch { throw new HttpError(400, "Requisição inválida."); }
}

export const csvCell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // evita injeção de fórmula no Excel
  return /[";\n\r,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const csvResponse = (name: string, rows: unknown[][]) =>
  new Response("﻿" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" },
  });
