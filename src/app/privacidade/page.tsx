import Link from "next/link";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";

export const metadata = { title: "Política de Privacidade" };

export default function PrivacidadePage() {
  return (
    <div className="flex-1">
      <SiteHeader />
      <article className="mx-auto max-w-2xl px-6 py-16 text-sm leading-relaxed text-gray-600">
        <h1 className="text-2xl font-semibold text-ovy-navy">Política de Privacidade</h1>
        <p className="mt-2 text-xs text-gray-400">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

        <h2 className="mt-8 text-lg font-semibold text-ovy-navy">1. O que coletamos</h2>
        <p className="mt-2">
          Coletamos seu nome e e-mail (via login com Google ou link mágico por
          e-mail), o áudio que você envia ou grava para transcrição, e o texto
          resultante da transcrição.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-ovy-navy">2. Como usamos seus dados</h2>
        <p className="mt-2">
          O áudio enviado é processado para gerar a transcrição e, em seguida,
          descartado — não armazenamos o arquivo de áudio de forma permanente.
          O texto da transcrição é salvo na sua conta apenas quando você opta
          por salvá-lo, e fica visível somente para você.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-ovy-navy">3. Compartilhamento com terceiros</h2>
        <p className="mt-2">
          Usamos provedores para operar o serviço: processamento de
          transcrição (Replicate), autenticação (Google, Resend), hospedagem
          (Vercel), banco de dados (Turso) e pagamentos (Stripe). Esses
          provedores processam dados estritamente para viabilizar essas
          funções.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-ovy-navy">4. Segurança</h2>
        <p className="mt-2">
          O acesso à sua conta é protegido por autenticação. Trabalhamos para
          manter boas práticas de segurança, mas não prometemos criptografia
          de ponta a ponta nem certificações que ainda não implementamos.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-ovy-navy">5. Seus direitos</h2>
        <p className="mt-2">
          Você pode excluir qualquer transcrição salva a qualquer momento pelo
          histórico, e pode encerrar sua conta entrando em contato conosco.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-ovy-navy">6. Contato</h2>
        <p className="mt-2">
          Dúvidas sobre privacidade:{" "}
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
