/** Configuração só por variáveis de ambiente do servidor. Nada daqui vai para o navegador. */
const isProd = process.env.NODE_ENV === "production";

function need(name: string, devDefault?: string): string {
  const v = process.env[name] ?? (isProd ? undefined : devDefault);
  if (!v) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return v;
}

export const config = {
  isProd,
  port: Number(process.env.PORT || 8787),
  host: process.env.HOST || "0.0.0.0",
  databaseUrl: need("DATABASE_URL", "postgres://financity_dev:dev-local-only@127.0.0.1:54329/financity"),
  /** Segredo do HMAC dos PINs (impressão digital única). NÃO pode mudar depois de cadastrar alunos. */
  pinSecret: need("FINANCITY_SECRET", "dev-only-pin-secret-do-not-use-in-production").trim(),
  /** Segredo compartilhado com o gateway da Vercel para assinar as chamadas. */
  gatewaySecret: need("GATEWAY_SECRET", "dev-only-gateway-secret-do-not-use-in-production").trim(),
  /** Origens (https://jogos.<domínio>) autorizadas a originar requisições que alteram dados. */
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",").map((s) => s.trim()).filter(Boolean),
  /** Em desenvolvimento/testes pode-se dispensar a assinatura (nunca em produção). */
  requireSignature: isProd ? true : process.env.REQUIRE_SIGNATURE !== "0",
  /** SÓ para testes locais: libera todos os mapas publicados para qualquer aluno. Ignorado (sempre falso) em produção. */
  /** Máximo de envios de resposta por aluno em 10 s antes de recusar (anti-automação). Um aluno real nunca chega perto (há 1,7 s de transição por resposta). */
  answerFloodMax: Math.max(1, Number(process.env.ANSWER_FLOOD_MAX || 8)),
  unlockAllMaps: isProd ? false : process.env.UNLOCK_ALL_MAPS === "1",
};

if (isProd && config.pinSecret.length < 32) throw new Error("FINANCITY_SECRET deve ter 32+ caracteres.");
if (isProd && config.gatewaySecret.length < 32) throw new Error("GATEWAY_SECRET deve ter 32+ caracteres.");
