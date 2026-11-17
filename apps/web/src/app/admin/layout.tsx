import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AdminNav from "./AdminNav";

export const dynamic = "force-dynamic";

// Aplica o tema salvo (ou o do sistema) ANTES de a página aparecer, para não piscar claro e depois escurecer.
const APLICAR_TEMA = `(function(){try{var t=localStorage.getItem("fc_admin_theme");if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.getElementById("admin-root").setAttribute("data-theme",t)}catch(e){}})()`;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/");
  if (s.role !== "teacher") redirect("/jogo");
  return (
    <div id="admin-root" suppressHydrationWarning className="admin-root min-h-screen bg-slate-100 print:bg-white">
      <script dangerouslySetInnerHTML={{ __html: APLICAR_TEMA }} />
      <AdminNav name={s.name} />
      <main className="mx-auto max-w-7xl px-4 py-6 print-area">{children}</main>
    </div>
  );
}
