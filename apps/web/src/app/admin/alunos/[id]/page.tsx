"use client";
import Link from "next/link";
import { use } from "react";
import { ErrorBox, Spinner, fmtDate, useApi } from "@/components/ui";
import { useAsm } from "../../FilterBar";

type R = {
  assessment: { id: number; sort: number; title: string } | null;
  student: { id: number; name: string; username: string; className: string | null; active: boolean; demo: boolean };
  school: string; teacher: string;
  attempt: { status: string; total: number; max: number; pct: number; startedAt: string; completedAt: string | null; medal: string | null } | null;
  answers: { number: number; title: string; theme: string; letter: string; text: string; points: number; why: string }[];
  strengths: string[]; retake: string[]; diagnosis: string; history: { action: string; detail: string; created_at: string }[];
};
const ACTIONS: Record<string, string> = { cadastro_alunos: "Cadastro", redefinir_pin: "PIN redefinido", redefinir_pin_lote: "PIN redefinido (lote)", gerar_pin_lote: "PIN gerado (lote)", desativar_aluno: "Conta desativada", reativar_aluno: "Conta reativada", nova_tentativa: "Nova tentativa liberada" };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [asm] = useAsm();
  const { data, error, loading, reload } = useApi<R>(`/api/admin/students/${id}/report${asm ? `?assessment=${asm}` : ""}`);
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;
  const a = data.attempt;
  const status = !a ? "Não iniciou" : a.status === "completed" ? "Concluída" : "Em andamento";
  return (
    <div className="space-y-4">
      <div className="no-print flex gap-2"><Link href="/admin/alunos" className="btn btn-ghost btn-sm">← Alunos</Link><button className="btn btn-primary btn-sm" onClick={() => window.print()}>Exportar PDF</button></div>
      <article className="card space-y-4">
        <header className="border-b pb-3">
          <p className="text-sm font-bold text-slate-600">{data.school || "Escola (configure em Configurações)"} • Prof. {data.teacher || "—"} • {new Date().toLocaleDateString("pt-BR")}</p>
          <h1 className="font-display text-2xl font-extrabold">RELATÓRIO INDIVIDUAL DE APRENDIZAGEM</h1>
          {data.student.demo && <p className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-sm font-bold text-amber-900">DADOS DE DEMONSTRAÇÃO (fictícios)</p>}
        </header>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="font-bold text-slate-600">Estudante</dt><dd className="text-lg font-bold">{data.student.name}</dd></div>
          <div><dt className="font-bold text-slate-600">Turma</dt><dd>{data.student.className ?? "—"}</dd></div>
          <div><dt className="font-bold text-slate-600">Mapa realizado</dt><dd>{data.assessment ? `Mapa ${data.assessment.sort} — ${data.assessment.title}` : "—"}</dd></div>
          <div><dt className="font-bold text-slate-600">Situação da atividade</dt><dd>{status}</dd></div>
          <div><dt className="font-bold text-slate-600">Início</dt><dd>{fmtDate(a?.startedAt)}</dd></div>
          <div><dt className="font-bold text-slate-600">Conclusão</dt><dd>{fmtDate(a?.completedAt)}</dd></div>
        </dl>

        {a ? (<>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-indigo-50 p-3"><div className="font-display text-3xl font-extrabold text-city-grape">{a.total}/{a.max}</div><div className="text-xs font-bold">Pontuação{a.status !== "completed" ? " parcial" : ""}</div></div>
            <div className="rounded-2xl bg-indigo-50 p-3"><div className="font-display text-3xl font-extrabold text-city-grape">{a.status === "completed" ? `${a.pct}%` : "—"}</div><div className="text-xs font-bold">Aproveitamento</div></div>
            <div className="rounded-2xl bg-indigo-50 p-3"><div className="font-display text-base font-extrabold text-city-grape">{a.medal ?? "—"}</div><div className="text-xs font-bold">Classificação motivacional</div></div>
          </div>
          <div className="overflow-x-auto" tabIndex={0}><table className="w-full min-w-[640px]"><thead><tr className="border-b"><th className="th">Questão</th><th className="th">Tema</th><th className="th">Alternativa</th><th className="th">Pontos</th><th className="th">Interpretação pedagógica</th></tr></thead>
            <tbody>{data.answers.map((r) => <tr key={r.number} className="border-b align-top last:border-0"><td className="td font-bold">Q{r.number}</td><td className="td">{r.theme}</td><td className="td"><b>{r.letter})</b> {r.text}</td><td className="td font-extrabold">{r.points}/5</td><td className="td">{r.why}</td></tr>)}</tbody></table></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50 p-3"><h2 className="font-bold text-emerald-900">Melhor desempenho (4 ou 5 pontos)</h2><p className="text-sm">{data.strengths.length ? data.strengths.join(", ") : "Nenhum tema neste patamar até agora."}</p></div>
            <div className="rounded-2xl bg-amber-50 p-3"><h2 className="font-bold text-amber-900">Podem precisar de retomada (até 2 pontos)</h2><p className="text-sm">{data.retake.length ? data.retake.join(", ") : "Nenhum tema neste patamar até agora."}</p></div>
          </div>
          <p className="rounded-2xl bg-slate-50 p-3 text-sm"><b>Interpretação:</b> {data.diagnosis}</p>
        </>) : <p className="text-slate-600">Este estudante ainda não iniciou a atividade.</p>}

        {data.history.length > 0 && <section className="no-print"><h2 className="font-bold">Registro administrativo</h2><ul className="text-sm text-slate-700">{data.history.map((h, i) => <li key={i}>{fmtDate(h.created_at)} — {ACTIONS[h.action] ?? h.action}{h.detail ? `: ${h.detail}` : ""}</li>)}</ul></section>}
      </article>
    </div>
  );
}
