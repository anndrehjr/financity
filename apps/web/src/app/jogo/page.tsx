import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import MapsClient from "./MapsClient";

export const dynamic = "force-dynamic";

export default async function Jogo() {
  const s = await getSession();
  if (!s) redirect("/");
  if (s.role !== "student") redirect("/admin");
  return <MapsClient />;
}
