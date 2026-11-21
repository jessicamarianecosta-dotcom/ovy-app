import { desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { setUserPlan, updatePlanSettings } from "./actions";

export default async function AdminPage() {
  const user = await requireUser();
  if (!user.isAdmin) notFound();

  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
    limit: 200,
  });
  const settings = await getSettings();

  const totalUsers = allUsers.length;
  const proUsers = allUsers.filter((u) => u.plan === "pro").length;
  const minutesThisCycle = allUsers.reduce((sum, u) => sum + u.minutesUsedThisCycle, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold">Painel administrativo</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Usuários" value={totalUsers} />
        <StatCard label="Assinantes Pro" value={proUsers} />
        <StatCard label="Minutos usados (ciclo)" value={minutesThisCycle} />
      </div>

      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Minutos e preço dos planos</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Mudar o preço do Pro cria um novo Price no Stripe automaticamente — quem já é
          assinante continua no valor antigo, só os próximos checkouts usam o novo.
        </p>
        <form action={updatePlanSettings} className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm">
            <span className="text-neutral-500">Minutos — Gratuito / mês</span>
            <input
              type="number"
              name="freePlanMinutes"
              defaultValue={settings.freePlanMinutes}
              min={1}
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-neutral-500">Minutos — Pro / mês</span>
            <input
              type="number"
              name="proPlanMinutes"
              defaultValue={settings.proPlanMinutes}
              min={1}
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-neutral-500">Preço — Pro (R$/mês)</span>
            <input
              type="number"
              name="proPlanPriceBrl"
              defaultValue={settings.proPlanPriceBrl}
              min={1}
              step="0.01"
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </label>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-ovy-navy px-4 py-2 text-sm font-medium text-white"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500">
            <tr>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Minutos usados</th>
              <th className="px-4 py-3">Status pagamento</th>
              <th className="px-4 py-3">Criado em</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {allUsers.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.plan}</td>
                <td className="px-4 py-3">{u.minutesUsedThisCycle}</td>
                <td className="px-4 py-3">{u.stripeSubscriptionStatus ?? "—"}</td>
                <td className="px-4 py-3">{u.createdAt.toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3">
                  <form action={setUserPlan.bind(null, u.id, u.plan === "pro" ? "free" : "pro")}>
                    <button type="submit" className="text-xs font-medium text-ovy-navy underline">
                      {u.plan === "pro" ? "Tornar Free" : "Liberar Pro (grátis)"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
