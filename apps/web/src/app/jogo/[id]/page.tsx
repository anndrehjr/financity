import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AtividadeClient from "./AtividadeClient";

export const dynamic = "force-dynamic";

export default async function Atividade({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s) redirect("/");
  if (s.role !== "student") redirect("/admin");
  const n = /^\d{1,9}$/.test(id) ? Number(id) : NaN;
  if (!Number.isInteger(n) || n < 1) notFound();
  return <AtividadeClient id={n} />;
}
