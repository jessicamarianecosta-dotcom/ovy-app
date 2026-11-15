import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export const dynamic = "force-dynamic";

function serializeError(error: unknown): Record<string, unknown> {
  const err = error as Error & { cause?: unknown; code?: string };
  return {
    message: err?.message,
    name: err?.name,
    code: (err as { code?: string })?.code,
    cause: err?.cause
      ? serializeError(err.cause)
      : undefined,
  };
}

export async function GET() {
  const url = process.env.TURSO_DATABASE_URL ?? "";
  const hasToken = Boolean(process.env.TURSO_AUTH_TOKEN);
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const steps: Record<string, unknown> = { urlPrefix: url.slice(0, 25), hasToken };

  try {
    const tables = await client.execute(
      "select name from sqlite_master where type='table'"
    );
    steps.tables = tables.rows.map((r) => r.name);
  } catch (error) {
    steps.tablesError = serializeError(error);
    return NextResponse.json(steps, { status: 500 });
  }

  try {
    const count = await client.execute("select count(*) as n from users");
    steps.usersCount = count.rows;
  } catch (error) {
    steps.usersCountError = serializeError(error);
    return NextResponse.json(steps, { status: 500 });
  }

  try {
    const byEmail = await client.execute({
      sql: "select id, email from users where email = ?",
      args: ["jessicamarianecosta@gmail.com"],
    });
    steps.byEmail = byEmail.rows;
  } catch (error) {
    steps.byEmailError = serializeError(error);
    return NextResponse.json(steps, { status: 500 });
  }

  return NextResponse.json(steps);
}
