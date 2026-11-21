import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

// Endpoint temporário — só pra listar e-mails/nomes/telefones e achar as
// contas certas antes de liberar o Pro manualmente. Removido em seguida.
export async function POST(request: Request) {
  const secret = request.headers.get("x-debug-secret");
  if (!secret || secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const allUsers = await db.query.users.findMany({
    columns: { email: true, name: true, phone: true, plan: true, createdAt: true },
  });

  return NextResponse.json({ users: allUsers });
}
