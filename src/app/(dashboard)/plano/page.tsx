import { requireUser } from "@/lib/current-user";
import { resetCycleIfNeeded, remainingMinutes } from "@/lib/minutes";
import { planMinutes, EXTRA_PACKS } from "@/lib/billing-cycle";
import { getSettings } from "@/lib/settings";
import { UpgradeButton, ManageBillingButton, BuyPackButton } from "@/components/billing-buttons";

export default async function PlanoPage() {
  const user = await resetCycleIfNeeded(await requireUser());
  const settings = await getSettings();
  const total = planMinutes(user.plan as "free" | "pro", settings);
  const used = user.minutesUsedThisCycle;
  const left = await remainingMinutes(user);
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
          <p className="font-semibold">
            Plano Pro — R$ {settings.proPlanPriceBrl.toFixed(2).replace(".", ",")}/mês
          </p>
          <p className="mt-1 text-sm text-neutral-300">
            {settings.proPlanMinutes} minutos por mês para transcrever sem se preocupar.
          </p>
          <div className="mt-4">
            <UpgradeButton />
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Pacotes avulsos de minutos</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Sem assinatura, sem mensalidade — compra única, os minutos ficam guardados pra quando precisar.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {EXTRA_PACKS.map((pack) => (
            <div key={pack.id} className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="font-semibold">{pack.label}</p>
              <p className="mt-1 text-2xl font-semibold">{pack.minutes} min</p>
              <p className="mt-1 text-sm text-neutral-500">
                R$ {pack.priceBRL.toFixed(2).replace(".", ",")}
              </p>
              <div className="mt-4">
                <BuyPackButton packId={pack.id} label="Comprar" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
