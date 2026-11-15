import Link from "next/link";
import { Mic, FileText, Download, History, Check } from "lucide-react";

const PLANS = [
  {
    name: "Gratuito",
    price: "R$ 0",
    minutes: "30 min/mês",
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$ 17/mês",
    minutes: "1.000 min/mês",
    highlight: true,
  },
];

export default function LandingPage() {
  return (
    <div className="flex-1">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold">Ovy</span>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/entrar" className="text-neutral-600 hover:text-neutral-900">
              Entrar
            </Link>
            <Link
              href="/entrar"
              className="rounded-full bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700"
            >
              Começar gratuitamente
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Falou, transcreveu.
        </h1>
        <p className="mt-4 text-lg text-neutral-600">
          Transforme seus áudios em textos organizados, editáveis e prontos para
          usar. Menos digitação, mais produtividade.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/entrar"
            className="rounded-full bg-neutral-900 px-6 py-3 font-medium text-white hover:bg-neutral-700"
          >
            Transcrever meu primeiro áudio
          </Link>
        </div>
        <p className="mt-3 text-sm text-neutral-500">
          Sem cartão de crédito. 30 minutos gratuitos por mês.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Mic, label: "Grave ou envie áudio" },
          { icon: FileText, label: "Versão fiel ou organizada" },
          { icon: Download, label: "Exporte em PDF ou Word" },
          { icon: History, label: "Histórico sincronizado" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-6 text-center"
          >
            <Icon className="h-6 w-6 text-neutral-700" />
            <p className="text-sm font-medium text-neutral-700">{label}</p>
          </div>
        ))}
      </section>

      <section id="precos" className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="text-center text-2xl font-semibold">Planos simples</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 ${
                plan.highlight
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <p className="text-sm font-medium opacity-80">{plan.name}</p>
              <p className="mt-2 text-3xl font-bold">{plan.price}</p>
              <p
                className={`mt-1 text-sm ${
                  plan.highlight ? "text-neutral-300" : "text-neutral-500"
                }`}
              >
                {plan.minutes}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" /> Transcrição fiel e organizada
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" /> Exportação em PDF e Word
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" /> Histórico sincronizado
                </li>
              </ul>
              <Link
                href="/entrar"
                className={`mt-6 block rounded-full px-4 py-2 text-center text-sm font-medium ${
                  plan.highlight
                    ? "bg-white text-neutral-900"
                    : "bg-neutral-900 text-white"
                }`}
              >
                Começar
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-neutral-200 py-8 text-center text-sm text-neutral-500">
        Ovy — © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
