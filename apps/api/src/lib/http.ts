export const csvCell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // evita injeção de fórmula no Excel
  return /[";\n\r,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const csvResponse = (name: string, rows: unknown[][]) =>
  new Response("﻿" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" },
  });

/** Inteiro positivo de parâmetro de rota/consulta; qualquer outra coisa vira NaN (e o 404/400 correspondente). */
export const toId = (v: string | undefined | null): number => (v && /^\d{1,9}$/.test(v) ? Number(v) : NaN);
