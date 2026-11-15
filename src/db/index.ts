import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Fallback evita que a simples ausência da env var derrube o build (coleta de
// dados de página do Next.js importa este módulo). Sem TURSO_DATABASE_URL
// configurada de verdade, qualquer consulta real falha em runtime.
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:/tmp/ovy-build-placeholder.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
