// Só aparência dos gráficos (cores e opções visuais). Não contém dados nem lógica.
export const SERIES = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export const BAR_RADIUS_V: [number, number, number, number] = [6, 6, 0, 0]; // barras em pé
export const BAR_RADIUS_H: [number, number, number, number] = [0, 6, 6, 0]; // barras deitadas

/** Eixos sem linha pesada; o texto e a cor vêm do CSS (reports-theme.css). */
export const AXIS = { tickLine: false, axisLine: false, tick: { fontSize: 12 } } as const;

/** Tooltip: fundo #18181b/borda #27272a no escuro (variáveis do tema; no claro, as claras equivalentes). */
export const TOOLTIP = {
  contentStyle: { background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 12 },
  labelStyle: { color: "var(--text)", fontWeight: 600 },
  itemStyle: { color: "var(--text)" },
  cursor: { fill: "var(--panel-2)", fillOpacity: 0.6 },
} as const;
