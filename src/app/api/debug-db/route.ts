import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.TURSO_DATABASE_URL ?? "";
  const hasToken = Boolean(process.env.TURSO_AUTH_TOKEN);

  try {
    const client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const result = await client.execute("select 1 as ok");
    return NextResponse.json({
      urlPrefix: url.slice(0, 20),
      hasToken,
      ok: true,
      rows: result.rows,
    });
  } catch (error) {
    const err = error as Error & { cause?: unknown };
    return NextResponse.json(
      {
        urlPrefix: url.slice(0, 20),
        hasToken,
        ok: false,
        message: err?.message,
        name: err?.name,
        cause: JSON.stringify(err?.cause, Object.getOwnPropertyNames((err?.cause as object) ?? {})),
        stack: err?.stack?.split("\n").slice(0, 5),
      },
      { status: 500 }
    );
  }
}
