import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Mapa1Client from "./Mapa1Client";

export const dynamic = "force-dynamic";

export default async function Mapa1() {
  const s = await getSession();
  if (!s) redirect("/");
  if (s.role !== "student") redirect("/admin");
  return <Mapa1Client />;
}
