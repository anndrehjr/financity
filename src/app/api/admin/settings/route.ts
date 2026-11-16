import { api, body } from "@/lib/http";
import bcrypt from "bcryptjs";
import { requireRole, isStrongPassword } from "@/lib/auth";
import { db, getSetting, setSetting } from "@/lib/db";

export const GET = api(async (_req: Request) => {
  await requireRole("teacher");
  return { schoolName: getSetting("school_name", ""), teacherName: getSetting("teacher_name", "") };
});

export const PUT = api(async (req: Request) => {
  const t = await requireRole("teacher");
  const b = await body<{ schoolName?: string; teacherName?: string; currentPassword?: string; newPassword?: string }>(req);
  if (b.newPassword) {
    const row = db().prepare("SELECT password_hash FROM teachers WHERE id=?").get(t.id) as { password_hash: string };
    if (!b.currentPassword || !(await bcrypt.compare(b.currentPassword, row.password_hash))) return Response.json({ error: "Senha atual incorreta." }, { status: 400 });
    if (!isStrongPassword(b.newPassword)) return Response.json({ error: "A nova senha precisa ter 12+ caracteres, com maiúscula, minúscula, número e símbolo." }, { status: 400 });
    db().prepare("UPDATE teachers SET password_hash=? WHERE id=?").run(await bcrypt.hash(b.newPassword, 12), t.id);
  }
  if (typeof b.schoolName === "string") setSetting("school_name", b.schoolName.slice(0, 120));
  if (typeof b.teacherName === "string") setSetting("teacher_name", b.teacherName.slice(0, 120));
});
