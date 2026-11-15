import { requireUser } from "@/lib/current-user";
import { signOutAction } from "../actions";

export default async function ConfiguracoesPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Configurações</h1>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-500">Nome</dt>
            <dd className="font-medium">{user.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">E-mail</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Plano</dt>
            <dd className="font-medium capitalize">
              {user.plan === "pro" ? "Pro" : "Gratuito"}
            </dd>
          </div>
        </dl>
      </div>

      <form action={signOutAction} className="mt-6">
        <button
          type="submit"
          className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Sair da conta
        </button>
      </form>
    </div>
  );
}
