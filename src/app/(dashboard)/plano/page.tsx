import { requireUser } from "@/lib/current-user";
import { resetCycleIfNeeded, remainingMinutes } from "@/lib/minutes";
import { planMinutes, PRO_PLAN_MINUTES, PRO_PLAN_PRICE_BRL } from "@/lib/billing-cycle";
import { UpgradeButton, ManageBillingButton } from "@/components/billing-buttons";

export default async function PlanoPage() {
  const user = await resetCycleIfNeeded(await requireUser());
  const total = planMinutes(user.plan as "free" | "pro");
  const used = user.minutesUsedThisCycle;
  const left = remainingMinutes(user);
  const percentUsed = Math.min(100, Math.round((used / total) * 100));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Meu plano</h1>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Plano atual</p>
            <p className="text-lg font-semibold capitalize">
              {user.plan === "pro" ? "Pro" : "Gratuito"}
            </p>
          </div>
          {user.plan === "pro" ? <ManageBillingButton /> : <UpgradeButton />}
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm text-neutral-500">
            <span>{used} min usados</span>
            <span>{total} min / mês</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full bg-neutral-900"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-neutral-600">
            Você tem <strong>{left} minutos</strong> disponíveis agora
            {user.extraMinutesBalance > 0 && (
              <> (incluindo {user.extraMinutesBalance} min de pacotes extras)</>
            )}
            .
          </p>
        </div>
      </div>

      {user.plan === "free" && (
        <div className="mt-6 rounded-2xl border border-neutral-900 bg-neutral-900 p-6 text-white">
          <p className="font-semibold">Plano Pro — R$ {PRO_PLAN_PRICE_BRL}/mês</p>
          <p className="mt-1 text-sm text-neutral-300">
            {PRO_PLAN_MINUTES} minutos por mês para transcrever sem se preocupar.
          </p>
          <div className="mt-4">
            <UpgradeButton />
          </div>
        </div>
      )}
    </div>
  );
}
