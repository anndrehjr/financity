// Integridade das partidas (antitrapaça). A API é a fonte de verdade: o navegador só RELATA o que seus próprios componentes observaram;
// gravidade, penalidade, bloqueio e pontuação são decididos aqui. Nada neste módulo "acusa" o aluno: eventos incertos são apenas indicadores.
import { z } from "zod";
import { getSetting, one, q, setSetting, tx, type Q } from "./db.js";
import { HttpError } from "./auth.js";
import { W, assertTeacherStudent, ownedStudents } from "./scope.js";

// ───────── catálogo de eventos ─────────
/** Eventos que o NAVEGADOR pode relatar (só o que os componentes do Financity conseguem observar com certeza). */
export const CLIENT_EVENTS = {
  impressao_iniciada: { certainty: "detected", label: "a impressão da página foi iniciada", defaultSeverity: 2 },
  copia_conteudo: { certainty: "detected", label: "houve tentativa de copiar ou recortar o conteúdo da questão", defaultSeverity: 2 },
  atalho_impressao: { certainty: "detected", label: "o atalho de impressão foi pressionado", defaultSeverity: 1 },
  tecla_captura_tela: { certainty: "detected", label: "uma tecla ou atalho de captura de tela foi pressionado (isto não confirma que a captura ocorreu)", defaultSeverity: 1 },
} as const;
export type ClientEvent = keyof typeof CLIENT_EVENTS;

/** Indicadores calculados NO SERVIDOR. Sempre gravidade 1, sem penalidade: servem para revisão do professor, não para acusação. */
export const SERVER_INDICATORS = {
  resposta_muito_rapida: "resposta enviada mais rápido do que o tempo mínimo plausível de leitura",
  sequencia_respostas_rapidas: "várias respostas seguidas abaixo do tempo mínimo plausível",
  padrao_posicao_repetido: "respostas seguidas sempre na mesma posição da tela",
  requisicoes_anormais: "quantidade anormal de envios de resposta em poucos segundos",
  sessoes_simultaneas: "outra sessão do mesmo aluno estava ativa ao mesmo tempo",
} as const;
export type ServerIndicator = keyof typeof SERVER_INDICATORS;

export const EVENT_LABELS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(CLIENT_EVENTS).map(([k, v]) => [k, v.label])),
  ...SERVER_INDICATORS,
};
export const EVENT_TITLES: Record<string, string> = {
  impressao_iniciada: "Impressão iniciada", copia_conteudo: "Tentativa de copiar conteúdo", atalho_impressao: "Atalho de impressão",
  tecla_captura_tela: "Tecla de captura de tela", resposta_muito_rapida: "Resposta muito rápida", sequencia_respostas_rapidas: "Sequência de respostas rápidas",
  padrao_posicao_repetido: "Padrão de posição repetido", requisicoes_anormais: "Envios anormais", sessoes_simultaneas: "Sessões simultâneas",
};

// ───────── configuração (editável pelo professor, auditada) ─────────
const sev12 = z.union([z.literal(1), z.literal(2)]);
export const configSchema = z.object({
  enabled: z.boolean().default(true),
  watermark: z.boolean().default(false),
  protectCopy: z.boolean().default(true),
  protectPrint: z.boolean().default(true),
  suspendSeconds: z.number().int().min(0).max(600).default(20),
  blockAfter: z.number().int().min(0).max(20).default(3),
  deductPoints: z.number().int().min(0).max(5).default(0),
  singleSession: z.boolean().default(false),
  retentionDays: z.number().int().min(30).max(730).default(180),
  eventSeverity: z.object({
    impressao_iniciada: sev12.default(2), copia_conteudo: sev12.default(2), atalho_impressao: sev12.default(1), tecla_captura_tela: sev12.default(1),
  }).default({ impressao_iniciada: 2, copia_conteudo: 2, atalho_impressao: 1, tecla_captura_tela: 1 }),
});
export type IntegrityConfig = z.infer<typeof configSchema>;

const CFG_KEY = "integrity_config";
export async function getConfig(c?: Q): Promise<IntegrityConfig> {
  const raw = c ? (await one<{ value: string }>("SELECT value FROM settings WHERE key=$1", [CFG_KEY], c))?.value : await getSetting(CFG_KEY, "");
  let obj: unknown = {};
  try { obj = raw ? JSON.parse(raw) : {}; } catch { obj = {}; }
  const r = configSchema.safeParse(obj);
  return r.success ? r.data : configSchema.parse({});
}

export async function updateConfig(teacherId: number, input: unknown): Promise<IntegrityConfig> {
  const next = configSchema.parse(input);
  const before = await getConfig();
  await setSetting(CFG_KEY, JSON.stringify(next));
  await audit({ teacherId, action: "config", detail: `Regras alteradas. Antes: ${JSON.stringify(before)} Depois: ${JSON.stringify(next)}` });
  return next;
}

/** O que o aluno precisa saber para o navegador aplicar as proteções (nada de regras de penalidade). */
export const publicConfig = (cfg: IntegrityConfig) => ({ enabled: cfg.enabled, watermark: cfg.enabled && cfg.watermark, protectCopy: cfg.enabled && cfg.protectCopy, protectPrint: cfg.enabled && cfg.protectPrint });

// ───────── auditoria ─────────
export async function audit(o: { eventId?: number | null; attemptId?: number | null; teacherId: number | null; action: string; detail?: string }, c?: Q) {
  await q("INSERT INTO integrity_audit(event_id,attempt_id,teacher_id,action,detail) VALUES($1,$2,$3,$4,$5)",
    [o.eventId ?? null, o.attemptId ?? null, o.teacherId, o.action, (o.detail ?? "").slice(0, 2000)], c);
}

// ───────── estado da partida (bloqueio/suspensão) ─────────
export type Gate = { status: "ok" | "suspended" | "blocked"; secondsLeft: number; message: string | null };
type AttemptGate = { id: number; integrity_status: string; secondsLeft: number | null; integrity_event_id: number | null };

const GATE_SQL = `id,integrity_status,integrity_event_id,CASE WHEN integrity_until IS NULL THEN NULL ELSE GREATEST(0, ceil(extract(epoch FROM (integrity_until-now()))))::int END "secondsLeft"`;

/** Lê o estado e encerra a suspensão que já terminou. */
export async function gateOf(attemptId: number, c?: Q, lock = false): Promise<Gate> {
  const a = await one<AttemptGate>(`SELECT ${GATE_SQL} FROM attempts WHERE id=$1${lock ? " FOR UPDATE" : ""}`, [attemptId], c);
  if (!a) return { status: "ok", secondsLeft: 0, message: null };
  if (a.integrity_status === "suspended" && (a.secondsLeft ?? 0) <= 0) {
    await q("UPDATE attempts SET integrity_status='ok', integrity_until=NULL WHERE id=$1 AND integrity_status='suspended'", [attemptId], c);
    return { status: "ok", secondsLeft: 0, message: null };
  }
  if (a.integrity_status === "blocked") return { status: "blocked", secondsLeft: 0, message: "Sua partida foi bloqueada e aguarda a liberação do professor." };
  if (a.integrity_status === "suspended") return { status: "suspended", secondsLeft: a.secondsLeft ?? 0, message: "Sua partida está temporariamente suspensa." };
  return { status: "ok", secondsLeft: 0, message: null };
}

/** Usado ao responder: partida suspensa ou bloqueada não aceita respostas (423). */
export async function assertNotLocked(attemptId: number, c: Q) {
  const g = await gateOf(attemptId, c);
  if (g.status === "blocked") throw new HttpError(423, "Partida bloqueada. Aguarde a liberação do professor para continuar.");
  if (g.status === "suspended") throw new HttpError(423, `Partida temporariamente suspensa. Aguarde ${g.secondsLeft} s para continuar.`);
}

// ───────── limites (abuso) ─────────
const hits = new Map<string, number[]>();
/** Janela deslizante em memória (por processo). Retorna true se passou do limite. */
export function overLimit(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > 60_000) hits.delete(k);
  return arr.length > max;
}

// ───────── gravação ─────────
const cleanDevice = (s?: string | null) => (s && /^[\p{L}\p{N} ·.\-]{1,60}$/u.test(s) ? s : null);
const cleanDetail = (s?: string | null) => (s && /^[A-Za-z0-9+ _\-]{1,30}$/.test(s) ? s : null);

async function insertEvent(c: Q | undefined, e: {
  studentId: number; sessionRef: string | null; assessmentId: number | null; attemptId: number | null; type: string; severity: number;
  certainty: "detected" | "indicator"; source: "client" | "server"; evidence: Record<string, unknown>; device?: string | null; penalty?: string; pointsDeducted?: number;
}): Promise<number> {
  const r = await one<{ id: number }>(
    `INSERT INTO integrity_events(student_id,session_ref,assessment_id,attempt_id,event_type,severity,certainty,source,evidence,device,penalty,points_deducted)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12) RETURNING id`,
    [e.studentId, e.sessionRef, e.assessmentId, e.attemptId, e.type, e.severity, e.certainty, e.source, JSON.stringify(e.evidence), cleanDevice(e.device), e.penalty ?? "none", e.pointsDeducted ?? 0], c);
  return r!.id;
}

/** Indicador do servidor (gravidade 1, sem penalidade). `dedupeMinutes`: não repete o mesmo tipo na mesma tentativa nesse intervalo. */
export async function recordIndicator(c: Q | undefined, o: { studentId: number; attemptId: number | null; assessmentId: number | null; sessionRef?: string | null; type: ServerIndicator; evidence?: Record<string, unknown>; dedupeMinutes?: number }): Promise<number | null> {
  if (o.dedupeMinutes) {
    const dup = await one("SELECT 1 FROM integrity_events WHERE student_id=$1 AND event_type=$2 AND attempt_id IS NOT DISTINCT FROM $3 AND detected_at > now() - make_interval(mins => $4)",
      [o.studentId, o.type, o.attemptId, o.dedupeMinutes], c);
    if (dup) return null;
  }
  return insertEvent(c, { studentId: o.studentId, sessionRef: o.sessionRef ?? null, assessmentId: o.assessmentId, attemptId: o.attemptId, type: o.type, severity: 1, certainty: "indicator", source: "server", evidence: { ...o.evidence, observado: SERVER_INDICATORS[o.type] } });
}

export type ClientReport = { action: "none" | "notice" | "warning" | "suspended" | "blocked"; message: string | null; secondsLeft: number; eventId: number | null };

const clientBody = z.object({ type: z.enum(Object.keys(CLIENT_EVENTS) as [ClientEvent, ...ClientEvent[]]), detail: z.string().max(40).optional(), device: z.string().max(80).optional() });
export const parseClientEvent = (raw: unknown) => clientBody.parse(raw);

const NONE: ClientReport = { action: "none", message: null, secondsLeft: 0, eventId: null };

/**
 * Registra uma ocorrência relatada pelo navegador e decide a consequência.
 * O navegador não escolhe gravidade nem penalidade; só o tipo (lista fixa) e, no máximo, o nome da tecla.
 * Limitações: um aluno pode forjar a própria chamada, mas só consegue prejudicar a si mesmo (nunca a outro aluno, nem apagar histórico).
 */
export async function recordClientEvent(studentId: number, assessmentId: number, sessionRef: string | null, input: z.infer<typeof clientBody>): Promise<ClientReport> {
  const cfg = await getConfig();
  if (!cfg.enabled) return NONE;
  const attempt = await one<{ id: number }>("SELECT id FROM attempts WHERE student_id=$1 AND assessment_id=$2 AND status='in_progress'", [studentId, assessmentId]);
  if (!attempt) return NONE; // sem partida em andamento não há o que proteger
  if (overLimit(`ev:${studentId}`, 30, 10 * 60_000)) return NONE; // excesso de relatos: ignora (nunca vira penalidade extra)

  return tx(async (c) => {
    const att = await one<{ id: number; total_points: number }>("SELECT id,total_points FROM attempts WHERE id=$1 AND status='in_progress' FOR UPDATE", [attempt.id], c);
    if (!att) return NONE;
    // evita repetir o mesmo evento em sequência imediata (tecla segurada, evento duplicado do navegador)
    const dup = await one("SELECT 1 FROM integrity_events WHERE attempt_id=$1 AND event_type=$2 AND detected_at > now() - interval '3 seconds'", [att.id, input.type], c);
    if (dup) { const g = await gateOf(att.id, c); return { ...NONE, ...(g.status !== "ok" ? { action: g.status, message: g.message, secondsLeft: g.secondsLeft } : {}) } as ClientReport; }

    const meta = CLIENT_EVENTS[input.type];
    const configured = cfg.eventSeverity[input.type];
    const evidence: Record<string, unknown> = { fonte: "navegador", observado: meta.label };
    const d = cleanDetail(input.detail); if (d) evidence.detalhe = d;
    const common = { studentId, sessionRef, assessmentId, attemptId: att.id, type: input.type, certainty: meta.certainty, source: "client" as const, evidence, device: input.device };

    if (configured === 1) { // atividade incomum: só alerta no painel
      const id = await insertEvent(c, { ...common, severity: 1 });
      return { action: "notice", message: `Atividade incomum identificada: ${meta.label}. A ocorrência foi registrada para análise do professor. Nenhuma penalidade foi aplicada.`, secondsLeft: 0, eventId: id };
    }

    const gate = await gateOf(att.id, c, true);
    if (gate.status === "blocked") { // já bloqueada: registra, sem empilhar penalidades
      const id = await insertEvent(c, { ...common, severity: 2 });
      return { action: "blocked", message: gate.message, secondsLeft: 0, eventId: id };
    }

    // violação detectada: conta as anteriores desta partida desde a última liberação (justificadas não contam)
    const prior = (await one<{ n: number }>(
      `SELECT count(*)::int n FROM integrity_events e JOIN attempts a ON a.id=e.attempt_id
       WHERE e.attempt_id=$1 AND e.severity>=2 AND e.status<>'justified' AND e.penalty_cancelled_at IS NULL AND (a.integrity_released_at IS NULL OR e.detected_at > a.integrity_released_at)`, [att.id], c))!.n;
    const n = prior + 1;
    const block = cfg.blockAfter > 0 && n >= cfg.blockAfter;
    const penalty = block ? "block" : cfg.suspendSeconds > 0 ? "suspension" : "warning";
    const deduct = cfg.deductPoints > 0 ? Math.min(cfg.deductPoints, att.total_points) : 0; // desconto é opcional e só vale para violações detectadas
    const id = await insertEvent(c, { ...common, severity: block ? 3 : 2, penalty, pointsDeducted: deduct, evidence: { ...evidence, ocorrenciaNaPartida: n } });
    if (deduct > 0) await q("UPDATE attempts SET total_points = total_points - $1 WHERE id=$2", [deduct, att.id], c);
    if (block) await q("UPDATE attempts SET integrity_status='blocked', integrity_until=NULL, integrity_event_id=$1 WHERE id=$2", [id, att.id], c);
    else if (penalty === "suspension") await q("UPDATE attempts SET integrity_status='suspended', integrity_until=now()+make_interval(secs => $1), integrity_event_id=$2 WHERE id=$3", [cfg.suspendSeconds, id, att.id], c);
    const message = block
      ? `Foi identificado que ${meta.label}. Esta é uma ocorrência repetida: sua partida foi bloqueada e só continua com a liberação do professor.`
      : `Foi identificado que ${meta.label}. Sua partida foi ${penalty === "suspension" ? "temporariamente suspensa" : "pausada"} e a ocorrência foi registrada para análise do professor.`;
    return { action: block ? "blocked" : penalty === "suspension" ? "suspended" : "warning", message, secondsLeft: block ? 0 : penalty === "suspension" ? cfg.suspendSeconds : 0, eventId: id } as ClientReport;
  });
}

// ───────── tempo plausível e padrões (chamado dentro da transação da resposta) ─────────
/** Tempo mínimo plausível para ler o enunciado: ~0,12 s por palavra, entre 2 e 8 s. Serve só para gerar indicador. */
export const minPlausibleSeconds = (prompt: string) => Math.min(8, Math.max(2, prompt.trim().split(/\s+/).length * 0.12));

export async function analyzeAnswer(c: Q, o: { studentId: number; attemptId: number; assessmentId: number; sessionRef: string | null; elapsed: number | null; prompt: string; questionId: number }) {
  const cfg = await getConfig(c);
  if (!cfg.enabled) return;
  const base = { studentId: o.studentId, attemptId: o.attemptId, assessmentId: o.assessmentId, sessionRef: o.sessionRef };
  // 1. resposta mais rápida que o tempo mínimo plausível
  const min = minPlausibleSeconds(o.prompt);
  if (o.elapsed !== null && o.elapsed < min) {
    await recordIndicator(c, { ...base, type: "resposta_muito_rapida", evidence: { segundos: Math.round(o.elapsed * 10) / 10, minimoPlausivel: Math.round(min * 10) / 10, perguntaId: o.questionId } });
    const rapidas = (await one<{ n: number }>("SELECT count(*)::int n FROM integrity_events WHERE attempt_id=$1 AND event_type='resposta_muito_rapida'", [o.attemptId], c))!.n;
    if (rapidas >= 3) await recordIndicator(c, { ...base, type: "sequencia_respostas_rapidas", evidence: { respostasRapidas: rapidas }, dedupeMinutes: 1440 });
  }
  // 2. mesma posição na tela em respostas seguidas (só questões de escolha única)
  const pos = await q<{ display_pos: number }>("SELECT a.display_pos FROM answers a JOIN questions x ON x.id=a.question_id WHERE a.attempt_id=$1 AND x.kind='choice' ORDER BY a.answered_at DESC, a.id DESC LIMIT 5", [o.attemptId], c);
  if (pos.length === 5 && pos.every((p) => p.display_pos === pos[0].display_pos))
    await recordIndicator(c, { ...base, type: "padrao_posicao_repetido", evidence: { posicao: pos[0].display_pos, respostasSeguidas: 5 }, dedupeMinutes: 1440 });
  // 3. outra sessão do mesmo aluno ativa agora
  if (o.sessionRef) {
    const outra = await one("SELECT 1 FROM presence WHERE student_id=$1 AND ended_at IS NULL AND left(token_hash,8)<>$2 AND last_seen_at > now() - interval '120 seconds'", [o.studentId, o.sessionRef], c);
    if (outra) await recordIndicator(c, { ...base, type: "sessoes_simultaneas", evidence: { sessoesAtivas: 2 }, dedupeMinutes: 10 });
  }
}

/** Para o limitador de envios repetidos: grava o indicador fora da transação. */
export async function flagFlood(studentId: number, assessmentId: number, sessionRef: string | null) {
  const att = await one<{ id: number }>("SELECT id FROM attempts WHERE student_id=$1 AND assessment_id=$2 AND status='in_progress'", [studentId, assessmentId]);
  if (att && (await getConfig()).enabled) await recordIndicator(undefined, { studentId, attemptId: att.id, assessmentId, sessionRef, type: "requisicoes_anormais", evidence: { limite: "8 envios em 10 s" }, dedupeMinutes: 10 });
}

// ───────── painel do professor ─────────
export type IntegrityFilter = { scope: "real" | "demo" | "all"; classId: number | null; serie: number | null; studentId?: number | null; from?: string | null; to?: string | null; severity?: number | null; status?: string | null; certainty?: string | null };

function where(teacherId: number, f: IntegrityFilter) {
  const w = new W();
  ownedStudents(w, teacherId);
  if (f.scope === "real") w.add("s.is_demo=0");
  if (f.scope === "demo") w.add("s.is_demo=1");
  if (f.classId) w.add("s.class_id=?", f.classId);
  if (f.serie) w.add("s.serie=?", f.serie);
  if (f.studentId) w.add("s.id=?", f.studentId);
  return w;
}
const isDate = (s?: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export async function summary(teacherId: number, f: IntegrityFilter) {
  const w = where(teacherId, f);
  const r = (await one<Record<string, number>>(
    `SELECT count(DISTINCT e.student_id) FILTER (WHERE e.status<>'justified')::int "studentsWithEvents",
            count(*) FILTER (WHERE e.status='pending')::int pending,
            count(*) FILTER (WHERE e.status='confirmed')::int confirmed,
            count(*) FILTER (WHERE e.penalty<>'none' AND e.penalty_cancelled_at IS NULL)::int "penaltiesApplied",
            count(*) FILTER (WHERE e.status='pending' AND e.certainty='indicator')::int "pendingIndicators",
            count(*) FILTER (WHERE e.status='pending' AND e.certainty='detected')::int "pendingDetected"
     FROM integrity_events e JOIN students s ON s.id=e.student_id WHERE 1=1${w.sql}`, w.vals))!;
  const locked = (await one<{ blocked: number; suspended: number }>(
    `SELECT count(*) FILTER (WHERE a.integrity_status='blocked')::int blocked,
            count(*) FILTER (WHERE a.integrity_status='suspended' AND a.integrity_until > now())::int suspended
     FROM attempts a JOIN students s ON s.id=a.student_id WHERE a.status='in_progress' AND a.integrity_status<>'ok'${w.sql}`, w.vals))!;
  const recurrences = await q<{ studentId: number; name: string; className: string | null; count: number }>(
    `SELECT s.id "studentId", s.full_name name, c.name "className", count(*)::int count
     FROM integrity_events e JOIN students s ON s.id=e.student_id LEFT JOIN classes c ON c.id=s.class_id
     WHERE e.status<>'justified'${w.sql} GROUP BY s.id,s.full_name,c.name HAVING count(*) >= 2 ORDER BY count(*) DESC, s.full_name LIMIT 10`, w.vals);
  return { ...r, blockedNow: locked.blocked, suspendedNow: locked.suspended, recurrences };
}

export async function listEvents(teacherId: number, f: IntegrityFilter) {
  const w = where(teacherId, f);
  if (isDate(f.from)) w.add("e.detected_at >= (?::date)::timestamptz", f.from);
  if (isDate(f.to)) w.add("e.detected_at < (?::date + 1)::timestamptz", f.to);
  if (f.severity && [1, 2, 3].includes(f.severity)) w.add("e.severity=?", f.severity);
  if (f.status && ["pending", "confirmed", "justified"].includes(f.status)) w.add("e.status=?", f.status);
  if (f.certainty && ["detected", "indicator"].includes(f.certainty)) w.add("e.certainty=?", f.certainty);
  const rows = await q<Record<string, unknown>>(
    `SELECT e.id, e.student_id "studentId", s.full_name "studentName", c.name "className", s.serie, e.attempt_id "attemptId", e.assessment_id "assessmentId", m.title "assessmentTitle",
            e.event_type "eventType", e.severity, e.certainty, e.source, e.device, e.detected_at "detectedAt", e.penalty, e.points_deducted "pointsDeducted",
            e.penalty_cancelled_at "penaltyCancelledAt", e.status, e.reviewed_at "reviewedAt", t.name "reviewedBy",
            (SELECT count(*)::int FROM integrity_events x WHERE x.student_id=e.student_id AND x.status<>'justified') recurrences
     FROM integrity_events e JOIN students s ON s.id=e.student_id LEFT JOIN classes c ON c.id=s.class_id
     LEFT JOIN assessments a ON a.id=e.assessment_id LEFT JOIN maps m ON m.id=a.map_id LEFT JOIN teachers t ON t.id=e.reviewed_by
     WHERE 1=1${w.sql} ORDER BY e.detected_at DESC LIMIT 300`, w.vals);
  return rows.map((r) => ({ ...r, label: EVENT_TITLES[r.eventType as string] ?? r.eventType }));
}

async function loadOwnedEvent(teacherId: number, eventId: number, c?: Q) {
  const e = await one<{ id: number; student_id: number; attempt_id: number | null; status: string; penalty: string; points_deducted: number; penalty_cancelled_at: string | null }>(
    "SELECT id,student_id,attempt_id,status,penalty,points_deducted,penalty_cancelled_at FROM integrity_events WHERE id=$1", [eventId], c);
  if (!e) throw new HttpError(404, "Ocorrência não encontrada.");
  await assertTeacherStudent(teacherId, e.student_id, c); // professor só vê alunos das suas turmas
  return e;
}

export async function eventDetail(teacherId: number, eventId: number) {
  const e = await loadOwnedEvent(teacherId, eventId);
  const ev = (await one<Record<string, unknown>>(
    `SELECT e.id, e.student_id "studentId", s.full_name "studentName", c.name "className", s.serie, e.session_ref "sessionRef", e.attempt_id "attemptId", e.assessment_id "assessmentId", m.title "assessmentTitle",
            e.event_type "eventType", e.severity, e.certainty, e.source, e.evidence, e.device, e.detected_at "detectedAt", e.penalty, e.points_deducted "pointsDeducted",
            e.penalty_cancelled_at "penaltyCancelledAt", e.status, e.reviewed_at "reviewedAt", t.name "reviewedBy",
            at.integrity_status "attemptState", at.integrity_event_id = e.id "causesCurrentState"
     FROM integrity_events e JOIN students s ON s.id=e.student_id LEFT JOIN classes c ON c.id=s.class_id
     LEFT JOIN assessments a ON a.id=e.assessment_id LEFT JOIN maps m ON m.id=a.map_id LEFT JOIN teachers t ON t.id=e.reviewed_by LEFT JOIN attempts at ON at.id=e.attempt_id
     WHERE e.id=$1`, [e.id]))!;
  const trail = await q("SELECT a.id, a.action, a.detail, a.created_at \"createdAt\", t.name \"teacher\" FROM integrity_audit a LEFT JOIN teachers t ON t.id=a.teacher_id WHERE a.event_id=$1 ORDER BY a.created_at, a.id", [e.id]);
  const history = await q(
    `SELECT id,event_type "eventType",severity,certainty,status,penalty,penalty_cancelled_at "penaltyCancelledAt",detected_at "detectedAt" FROM integrity_events WHERE student_id=$1 ORDER BY detected_at DESC LIMIT 20`, [e.student_id]);
  return { ...ev, label: EVENT_TITLES[ev.eventType as string], observed: EVENT_LABELS[ev.eventType as string], trail, history };
}

const noteSchema = z.string().trim().max(300);
/** Libera a partida (suspensa ou bloqueada). Zera a contagem de reincidência a partir deste momento. */
async function releaseAttempt(c: Q, attemptId: number) {
  await q("UPDATE attempts SET integrity_status='ok', integrity_until=NULL, integrity_event_id=NULL, integrity_released_at=now() WHERE id=$1", [attemptId], c);
}
/** Devolve os pontos descontados por uma ocorrência (se ainda ativos). */
async function revertDeduction(c: Q, e: { attempt_id: number | null; points_deducted: number; penalty_cancelled_at: string | null }) {
  if (e.attempt_id && e.points_deducted > 0 && !e.penalty_cancelled_at) await q("UPDATE attempts SET total_points = total_points + $1 WHERE id=$2 AND status<>'voided'", [e.points_deducted, e.attempt_id], c);
}

export async function reviewEvent(teacherId: number, eventId: number, action: string, noteRaw: unknown) {
  const note = noteSchema.parse(noteRaw ?? "");
  if (!["confirm", "justify", "cancel_penalty"].includes(action)) throw new HttpError(400, "Ação desconhecida.");
  if (action !== "confirm" && note.length < 3) throw new HttpError(400, "Informe o motivo (mínimo 3 caracteres): a decisão fica registrada na auditoria.");
  await tx(async (c) => {
    await loadOwnedEvent(teacherId, eventId, c);
    const e = (await one<{ id: number; student_id: number; attempt_id: number | null; status: string; penalty: string; points_deducted: number; penalty_cancelled_at: string | null }>(
      "SELECT id,student_id,attempt_id,status,penalty,points_deducted,penalty_cancelled_at FROM integrity_events WHERE id=$1 FOR UPDATE", [eventId], c))!;
    const att = e.attempt_id ? await one<{ integrity_event_id: number | null }>("SELECT integrity_event_id FROM attempts WHERE id=$1 FOR UPDATE", [e.attempt_id], c) : undefined;
    const causesState = !!att && att.integrity_event_id === e.id;
    if (action === "confirm") {
      if (e.status === "confirmed") throw new HttpError(409, "Esta ocorrência já está confirmada.");
      if (e.status === "justified") throw new HttpError(409, "Esta ocorrência foi justificada; não pode ser confirmada.");
      await q("UPDATE integrity_events SET status='confirmed', reviewed_by=$1, reviewed_at=now() WHERE id=$2", [teacherId, e.id], c);
      await audit({ eventId: e.id, attemptId: e.attempt_id, teacherId, action: "confirmar", detail: note || "Violação confirmada com base nas evidências." }, c);
    } else if (action === "justify") {
      if (e.status === "justified") throw new HttpError(409, "Esta ocorrência já está justificada.");
      await revertDeduction(c, e);
      await q("UPDATE integrity_events SET status='justified', reviewed_by=$1, reviewed_at=now(), penalty_cancelled_at=COALESCE(penalty_cancelled_at, CASE WHEN penalty<>'none' THEN now() END) WHERE id=$2", [teacherId, e.id], c);
      if (causesState && e.attempt_id) await releaseAttempt(c, e.attempt_id);
      await audit({ eventId: e.id, attemptId: e.attempt_id, teacherId, action: "justificar", detail: note }, c);
    } else {
      if (e.penalty === "none") throw new HttpError(409, "Esta ocorrência não tem penalidade.");
      if (e.penalty_cancelled_at) throw new HttpError(409, "A penalidade já foi cancelada.");
      await revertDeduction(c, e);
      await q("UPDATE integrity_events SET penalty_cancelled_at=now(), reviewed_by=$1, reviewed_at=now() WHERE id=$2", [teacherId, e.id], c);
      if (causesState && e.attempt_id) await releaseAttempt(c, e.attempt_id);
      await audit({ eventId: e.id, attemptId: e.attempt_id, teacherId, action: "cancelar_penalidade", detail: `${note}${e.points_deducted ? ` (devolvidos ${e.points_deducted} pt)` : ""}` }, c);
    }
  });
}

/** Professor libera uma partida bloqueada/suspensa. */
export async function releaseByTeacher(teacherId: number, attemptId: number, noteRaw: unknown) {
  const note = noteSchema.parse(noteRaw ?? "");
  if (note.length < 3) throw new HttpError(400, "Informe o motivo (mínimo 3 caracteres): a liberação fica registrada na auditoria.");
  await tx(async (c) => {
    const a = await one<{ id: number; student_id: number; integrity_status: string }>("SELECT id,student_id,integrity_status FROM attempts WHERE id=$1 FOR UPDATE", [attemptId], c);
    if (!a) throw new HttpError(404, "Partida não encontrada.");
    await assertTeacherStudent(teacherId, a.student_id, c);
    if (a.integrity_status === "ok") throw new HttpError(409, "Esta partida não está bloqueada.");
    await releaseAttempt(c, a.id);
    await audit({ attemptId: a.id, teacherId, action: "liberar_partida", detail: note }, c);
  });
}

/** Partidas bloqueadas ou suspensas agora, para o painel. */
export async function lockedAttempts(teacherId: number, f: IntegrityFilter) {
  const w = where(teacherId, f);
  return q(
    `SELECT a.id "attemptId", a.integrity_status status, a.integrity_until "until", s.id "studentId", s.full_name "studentName", c.name "className", m.title "assessmentTitle", a.integrity_event_id "eventId"
     FROM attempts a JOIN students s ON s.id=a.student_id LEFT JOIN classes c ON c.id=s.class_id LEFT JOIN maps m ON m.id=a.map_id
     WHERE a.status='in_progress' AND (a.integrity_status='blocked' OR (a.integrity_status='suspended' AND a.integrity_until > now()))${w.sql} ORDER BY s.full_name`, w.vals);
}

export async function recentAudit(teacherId: number) {
  return q(
    `SELECT a.id, a.event_id "eventId", a.attempt_id "attemptId", a.action, a.detail, a.created_at "createdAt", t.name teacher, s.full_name "studentName"
     FROM integrity_audit a LEFT JOIN teachers t ON t.id=a.teacher_id
     LEFT JOIN integrity_events e ON e.id=a.event_id LEFT JOIN attempts at ON at.id=COALESCE(a.attempt_id, e.attempt_id) LEFT JOIN students s ON s.id=COALESCE(e.student_id, at.student_id)
     WHERE (s.id IS NULL AND a.action='config') OR s.class_id IN (SELECT class_id FROM teacher_classes WHERE teacher_id=$1) ORDER BY a.created_at DESC, a.id DESC LIMIT 100`, [teacherId]);
}

// ───────── retenção (LGPD) ─────────
/** Apaga ocorrências e auditoria mais antigas que o prazo de retenção configurado (padrão 180 dias). */
export async function purgeExpired(): Promise<{ events: number; audit: number }> {
  const days = (await getConfig()).retentionDays;
  const a = await q<{ n: number }>("WITH d AS (DELETE FROM integrity_audit WHERE created_at < now() - make_interval(days => $1) RETURNING 1) SELECT count(*)::int n FROM d", [days]);
  const e = await q<{ n: number }>("WITH d AS (DELETE FROM integrity_events WHERE detected_at < now() - make_interval(days => $1) RETURNING 1) SELECT count(*)::int n FROM d", [days]);
  return { events: e[0].n, audit: a[0].n };
}
