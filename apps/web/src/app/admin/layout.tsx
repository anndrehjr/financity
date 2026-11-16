import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AdminNav from "./AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/");
  if (s.role !== "teacher") redirect("/jogo");
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <AdminNav name={s.name} />
      <main className="mx-auto max-w-7xl px-4 py-6 print-area">{children}</main>
    </div>
  );
}
