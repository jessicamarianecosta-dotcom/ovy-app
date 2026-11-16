import Link from "next/link";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { FREE_PLAN_MINUTES, PRO_PLAN_MINUTES, PRO_PLAN_PRICE_BRL } from "@/lib/billing-cycle";

export const metadata = { title: "Termos de Uso" };

export default function TermosPage() {
  return (
    <div className="flex-1">
      <SiteHeader />
      <article className="mx-auto max-w-2xl px-6 py-16 text-sm leading-relaxed text-gray-600">
        <h1 className="text-2xl font-semibold text-ovy-navy">Termos de Uso</h1>
        <p className="mt-2 text-xs text-gray-400">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

        <h2 className="mt-8 text-lg font-semibold text-ovy-navy">1. O serviço</h2>
        <p className="mt-2">
          O Ovy transforma áudios em texto. O plano gratuito inclui{" "}
          {FREE_PLAN_MINUTES} minutos de transcrição por mês; o plano Pro
          inclui {PRO_PLAN_MINUTES} minutos por mês por R$ {PRO_PLAN_PRICE_BRL}
          /mês. Os limites e preços podem ser ajustados, e qualquer mudança
          será refletida nesta página e no painel do app.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-ovy-navy">2. Uso aceitável</h2>
        <p className="mt-2">
          Você é responsável pelo conteúdo dos áudios enviados. Não é permitido
          usar o Ovy para transcrever conteúdo ilegal ou que viole direitos de
          terceiros.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-ovy-navy">3. Assinatura e cancelamento</h2>
        <p className="mt-2">
          A assinatura do plano Pro é cobrada mensalmente via Stripe e pode
          ser cancelada a qualquer momento; o acesso ao plano Pro continua até
          o fim do período já pago.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-ovy-navy">4. Limites técnicos</h2>
        <p className="mt-2">
          Cada transcrição aceita áudios de até 2 minutos. Esse limite pode
          mudar conforme evoluirmos o serviço.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-ovy-navy">5. Contato</h2>
        <p className="mt-2">
          Dúvidas sobre estes termos:{" "}
          <a href="mailto:contato@ovyapp.com.br" className="underline">
            contato@ovyapp.com.br
          </a>
          .
        </p>

        <Link href="/" className="mt-10 inline-block text-sm font-medium text-ovy-navy underline">
          Voltar para a página inicial
        </Link>
      </article>
      <SiteFooter />
    </div>
  );
}
