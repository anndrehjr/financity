// Presença: quando o aluno entrou, se está on-line agora e quando saiu. Guarda só horários (nenhum dado pessoal novo).
import { one, q, type Q } from "./db.js";
import { W, ownedStudents, assertTeacherStudent } from "./scope.js";

/** Considera "on-line" quem deu sinal de vida nos últimos 120 s (o site avisa a cada 30 s). */
export const ONLINE_SECONDS = 120;
/** Se o último sinal de uma entrada aberta for mais antigo que isto (ex.: computador dormiu), a entrada é encerrada ali e uma nova começa. */
const GAP_SECONDS = 600;

/** Início de uma entrada (chamado no login do aluno). */
export async function presenceStart(studentId: number, tokenHash: string, c?: Q) {
  await q("INSERT INTO presence(student_id,token_hash) VALUES($1,$2)", [studentId, tokenHash], c);
}

/** Sinal de vida. Se a sessão é anterior a esta função (sem registro) ou ficou muito tempo sem sinal, abre uma nova entrada. */
export async function presencePing(studentId: number, tokenHash: string) {
  const open = await one<{ id: number; gap: number }>(
    "SELECT id, extract(epoch FROM (now()-last_seen_at))::int gap FROM presence WHERE token_hash=$1 AND student_id=$2 AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1",
    [tokenHash, studentId]);
  if (open && open.gap <= GAP_SECONDS) { await q("UPDATE presence SET last_seen_at=now() WHERE id=$1", [open.id]); return; }
  if (open) await q("UPDATE presence SET ended_at=last_seen_at, end_reason='inatividade' WHERE id=$1", [open.id]);
  await presenceStart(studentId, tokenHash);
}

/** Saída explícita (botão Sair). */
export async function presenceEnd(tokenHash: string, reason = "saiu") {
  await q("UPDATE presence SET ended_at=now(), last_seen_at=now(), end_reason=$2 WHERE token_hash=$1 AND ended_at IS NULL", [tokenHash, reason]);
}

/** Encerra as entradas abertas de um aluno (conta desativada). */
export async function presenceEndStudent(studentId: number, reason: string, c?: Q) {
  await q("UPDATE presence SET ended_at=now(), last_seen_at=now(), end_reason=$2 WHERE student_id=$1 AND ended_at IS NULL", [studentId, reason], c);
}

const TZ = "America/Sao_Paulo";
const DUR = "GREATEST(0, extract(epoch FROM (COALESCE(p.ended_at, p.last_seen_at) - p.started_at)))";

export type PresenceRow = {
  id: number; name: string; className: string | null; serie: number; active: number;
  online: boolean; lastEntry: string | null; lastExit: string | null; lastSeen: string | null;
  todaySeconds: number; totalSeconds: number; sessions: number;
};

/** Quadro do professor: um aluno por linha, com status, última entrada/saída e tempo de uso. */
export async function listPresence(teacherId: number, o: { classId: number | null; serie: number | null; scope: "real" | "demo" | "all" }) {
  const w = new W();
  ownedStudents(w, teacherId);
  if (o.scope === "real") w.add("s.is_demo=0");
  if (o.scope === "demo") w.add("s.is_demo=1");
  if (o.classId) w.add("s.class_id=?", o.classId);
  if (o.serie) w.add("s.serie=?", o.serie);
  const rows = await q<PresenceRow>(
    `SELECT s.id, s.full_name name, c.name "className", s.serie, s.active,
       EXISTS(SELECT 1 FROM presence p WHERE p.student_id=s.id AND p.ended_at IS NULL AND p.last_seen_at > now() - interval '${ONLINE_SECONDS} seconds') online,
       l.started_at "lastEntry", l.last_seen_at "lastSeen",
       COALESCE(l.ended_at, l.last_seen_at) "lastExit",
       COALESCE(t.today,0)::int "todaySeconds", COALESCE(t.total,0)::int "totalSeconds", COALESCE(t.n,0)::int sessions
     FROM students s LEFT JOIN classes c ON c.id=s.class_id
     LEFT JOIN LATERAL (SELECT started_at,last_seen_at,ended_at FROM presence WHERE student_id=s.id ORDER BY started_at DESC LIMIT 1) l ON true
     LEFT JOIN LATERAL (SELECT count(*) n, sum(${DUR}) total,
         sum(CASE WHEN (p.started_at AT TIME ZONE '${TZ}')::date = (now() AT TIME ZONE '${TZ}')::date THEN ${DUR} ELSE 0 END) today
       FROM presence p WHERE p.student_id=s.id) t ON true
     WHERE 1=1${w.sql} ORDER BY s.full_name LIMIT 1000`, w.vals);
  // quem está on-line não tem "saída"; quem nunca entrou também não
  return rows
    .map((r) => ({ ...r, lastExit: r.online || !r.lastEntry ? null : r.lastExit }))
    .sort((a, b) => Number(b.online) - Number(a.online) || a.name.localeCompare(b.name, "pt-BR"));
}

export type PresenceSession = { startedAt: string; endedAt: string | null; online: boolean; seconds: number; reason: string | null };

/** Histórico de entradas de um aluno (as 40 mais recentes). */
export async function studentPresence(teacherId: number, studentId: number): Promise<PresenceSession[]> {
  await assertTeacherStudent(teacherId, studentId);
  return q<PresenceSession>(
    `SELECT p.started_at "startedAt",
       CASE WHEN p.ended_at IS NULL AND p.last_seen_at > now() - interval '${ONLINE_SECONDS} seconds' THEN NULL ELSE COALESCE(p.ended_at, p.last_seen_at) END "endedAt",
       (p.ended_at IS NULL AND p.last_seen_at > now() - interval '${ONLINE_SECONDS} seconds') online,
       ${DUR}::int seconds,
       CASE WHEN p.ended_at IS NULL AND p.last_seen_at <= now() - interval '${ONLINE_SECONDS} seconds' THEN 'fechou a página' ELSE p.end_reason END reason
     FROM presence p WHERE p.student_id=$1 ORDER BY p.started_at DESC LIMIT 40`, [studentId]);
}
