export const HEADERS: { ts: string; ip: string; sig: string };
export function signRequest(o: { secret: string; method: string; pathAndQuery: string; ip: string; body?: string; ts?: number }): Record<string, string>;
export function verifyRequest(o: { secret: string; method: string; pathAndQuery: string; body?: string; headers: Record<string, string | undefined>; now?: number; maxSkewMs?: number }): boolean;
