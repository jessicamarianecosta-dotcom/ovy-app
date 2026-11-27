import Link from "next/link";
import {
  Mic,
  Upload,
  Pencil,
  Check,
  ShieldCheck,
  History,
  Smartphone,
  Languages,
  FileText,
  FileDown,
  GraduationCap,
  Users,
  Mic2,
  Briefcase,
  Lightbulb,
  NotebookPen,
  PlayCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { InfoTooltip } from "@/components/info-tooltip";
import { ProductMockup, Waveform } from "@/components/landing/product-mockup";
import { EditorMockup } from "@/components/landing/editor-mockup";
import { FaqAccordion } from "@/components/landing/faq-accordion";
import { MAX_TRANSCRIPTION_SECONDS } from "@/lib/billing-cycle";
import { getSettings } from "@/lib/settings";

const FEATURES = [
  { icon: Mic, title: "Gravação pelo microfone", description: "Grave direto pelo navegador, sem instalar nada." },
  { icon: Upload, title: "Importação de áudio", description: "Envie arquivos nos formatos mais comuns." },
  { icon: FileText, title: "Transcrição automática", description: "Áudio vira texto em poucos instantes." },
  { icon: Pencil, title: "Fiel e organizada", description: "Escolha entre o texto literal ou revisado." },
  { icon: Languages, title: "Idioma automático", description: "Detecta o idioma falado, com seleção manual." },
  { icon: NotebookPen, title: "Editor de texto", description: "Revise e ajuste o resultado antes de usar." },
  { icon: FileDown, title: "Exportação em PDF", description: "Baixe sua transcrição pronta para compartilhar." },
  { icon: FileDown, title: "Exportação em Word", description: "Edite depois no seu editor de texto favorito." },
  { icon: History, title: "Histórico", description: "Encontre qualquer transcrição salva quando precisar." },
  { icon: Smartphone, title: "Sincronização", description: "Acesse suas transcrições em qualquer dispositivo." },
];

const USE_CASES = [
  { icon: GraduationCap, title: "Estudos", description: "Transforme gravações de aulas em textos para revisar." },
  { icon: Users, title: "Reuniões", description: "Registre as decisões e os próximos passos discutidos." },
  { icon: Mic2, title: "Entrevistas", description: "Transforme conversas gravadas em documentos de texto." },
  { icon: Briefcase, title: "Trabalho", description: "Organize instruções e informações faladas no dia a dia." },
  { icon: Lightbulb, title: "Criação de conteúdo", description: "Transforme ideias faladas em roteiros e textos." },
  { icon: NotebookPen, title: "Uso pessoal", description: "Registre pensamentos e anotações rápidas por voz." },
];

function buildFaqItems(freePlanMinutes: number) {
  return [
  {
    question: "O que é o Ovy?",
    answer:
      "Ovy é uma plataforma que transforma áudios em textos editáveis, organizados e prontos para usar, direto do navegador.",
  },
  {
    question: "Como funciona a transcrição?",
    answer:
      "Você envia ou grava um áudio, o Ovy processa o conteúdo e devolve o texto em poucos instantes, nas versões fiel e organizada.",
  },
  {
    question: "Posso enviar arquivos de áudio?",
    answer: "Sim. Você pode enviar um arquivo de áudio já gravado diretamente pela interface do Ovy.",
  },
  {
    question: "Posso gravar diretamente pelo aplicativo?",
    answer: "Sim. Existe um botão de gravação que usa o microfone do seu dispositivo.",
  },
  {
    question: "Qual é a duração máxima de cada áudio?",
    answer: `Cada transcrição aceita áudios de até ${Math.round(
      MAX_TRANSCRIPTION_SECONDS / 60
    )} minutos.`,
  },
  {
    question: "Quais formatos são aceitos?",
    answer: "Os formatos de áudio mais comuns, como MP3, M4A, WAV e WEBM.",
  },
  {
    question: "Posso editar o texto transcrito?",
    answer: "Sim. Depois de transcrito, o texto fica em um editor onde você pode revisar e ajustar livremente.",
  },
  {
    question: "Qual é a diferença entre transcrição fiel e organizada?",
    answer:
      "A fiel mantém exatamente o que foi falado, incluindo repetições. A organizada corrige pontuação e remove repetições desnecessárias, preservando o sentido.",
  },
  {
    question: "Posso exportar para Word e PDF?",
    answer: "Sim, as duas versões do texto podem ser exportadas em PDF ou Word.",
  },
  {
    question: "Minhas transcrições ficam salvas?",
    answer: "Sim, ao salvar uma transcrição ela entra no seu histórico pessoal, vinculado à sua conta.",
  },
  {
    question: "Posso acessar de outros dispositivos?",
    answer: "Sim. Basta entrar com a mesma conta em qualquer dispositivo para ver seu histórico.",
  },
  {
    question: "Como funcionam os minutos gratuitos?",
    answer: `O plano gratuito inclui ${freePlanMinutes} minutos de transcrição por mês, renovados automaticamente a cada ciclo.`,
  },
  {
    question: "Posso comprar minutos adicionais?",
    answer: "Pacotes extras de minutos estarão disponíveis para quem precisar de mais do que o plano oferece.",
  },
  {
    question: "Posso cancelar meu plano?",
    answer: "Sim, a assinatura do plano Pro pode ser cancelada a qualquer momento, sem multa.",
  },
  ];
}

export default async function LandingPage() {
  const settings = await getSettings();
  const faqItems = buildFaqItems(settings.freePlanMinutes);
  return (
    <div className="flex-1 bg-white">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 85% 10%, rgba(139,92,246,0.08), transparent), radial-gradient(40% 40% at 10% 0%, rgba(17,27,54,0.05), transparent)",
          }}
        />
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-ovy-navy sm:text-5xl">
              Sua voz merece virar texto.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-gray-600">
              Transforme áudios em textos organizados, editáveis e prontos
              para usar. Sem perder tempo digitando.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/entrar"
                className="rounded-full bg-ovy-navy px-6 py-3 text-sm font-medium text-white transition hover:bg-violet-600"
              >
                Começar gratuitamente
              </Link>
              <a
                href="#demonstracao"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-ovy-navy hover:border-violet-400"
              >
                <PlayCircle className="h-4 w-4" />
                Ver como funciona
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              {settings.freePlanMinutes} minutos gratuitos por mês. Sem cartão de crédito.
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <ProductMockup />
          </div>
        </div>
      </section>

      {/* Demonstração */}
      <section id="demonstracao" className="border-t border-gray-100 bg-ovy-surface py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-3xl font-semibold text-ovy-navy">
            Do áudio ao texto em poucos instantes.
          </h2>
          <p className="mt-3 text-gray-600">
            Envie, acompanhe o processamento e receba sua transcrição pronta para editar.
          </p>

          <div className="mx-auto mt-10 aspect-video w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-400">
              <Waveform className="h-10" />
              <p className="text-sm">Vídeo de demonstração em breve</p>
            </div>
          </div>
        </div>
      </section>

      {/* Duas formas de transcrição */}
      <section id="como-funciona" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-semibold text-ovy-navy">
            Você escolhe como quer receber seu texto.
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                Transcrição fiel
              </span>
              <p className="mt-3 text-sm text-gray-600">
                Mantém o conteúdo falado, incluindo expressões, repetições e a
                maneira original de falar.
              </p>
              <div className="mt-4 space-y-2 rounded-xl bg-ovy-surface p-4 text-sm text-gray-700">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Resultado</p>
                <p>
                  &ldquo;Então, eu queria... eu queria conversar sobre o
                  projeto de amanhã, porque precisamos organizar algumas
                  coisas.&rdquo;
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-violet-200 bg-white p-6">
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
                Transcrição organizada
              </span>
              <p className="mt-3 text-sm text-gray-600">
                Melhora a pontuação, ortografia e remove repetições
                desnecessárias, preservando o significado.
              </p>
              <div className="mt-4 space-y-2 rounded-xl bg-ovy-surface p-4 text-sm text-gray-700">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Resultado</p>
                <p>
                  &ldquo;Quero conversar sobre o projeto de amanhã, pois
                  precisamos organizar alguns detalhes.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona - 3 passos */}
      <section className="border-t border-gray-100 bg-ovy-surface py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-semibold text-ovy-navy">
            Simples do começo ao fim.
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { step: "01", title: "Envie ou grave", description: "Envie um arquivo de áudio ou grave direto pelo microfone.", icon: Mic },
              { step: "02", title: "O Ovy transcreve", description: "A transcrição transforma o áudio em texto automaticamente.", icon: FileText },
              { step: "03", title: "Edite e utilize", description: "Revise, copie, salve ou exporte em PDF ou Word.", icon: Pencil },
            ].map(({ step, title, description, icon: Icon }) => (
              <div key={step} className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-violet-500">{step}</span>
                  <Icon className="h-5 w-5 text-ovy-navy" />
                </div>
                <h3 className="mt-3 font-semibold text-ovy-navy">{title}</h3>
                <p className="mt-1 text-sm text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-semibold text-ovy-navy">
            Tudo o que você precisa, sem complicação.
          </h2>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50">
                  <Icon className="h-5 w-5 text-violet-600" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-ovy-navy">{title}</h3>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Casos de uso */}
      <section className="border-t border-gray-100 bg-ovy-surface py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-semibold text-ovy-navy">
            Sua rotina pode ser mais simples.
          </h2>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-gray-200 bg-white p-5">
                <Icon className="h-6 w-6 text-violet-500" />
                <h3 className="mt-3 text-sm font-semibold text-ovy-navy">{title}</h3>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experiência do produto */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-3xl font-semibold text-ovy-navy">
            Edite, copie e exporte com um clique.
          </h2>
          <p className="mt-3 text-gray-600">
            A mesma experiência que você encontra assim que entra no Ovy.
          </p>
          <div className="mt-12">
            <EditorMockup />
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="border-t border-gray-100 bg-ovy-surface py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-3xl font-semibold text-ovy-navy">
            Comece gratuitamente. Evolua quando precisar.
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-7">
              <p className="text-sm font-medium text-gray-500">Gratuito</p>
              <p className="mt-2 text-4xl font-bold text-ovy-navy">R$ 0</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-violet-500" /> {settings.freePlanMinutes} minutos por mês
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-violet-500" /> Transcrição fiel e organizada
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-violet-500" /> Exportação em PDF e Word
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-violet-500" /> Histórico de transcrições
                </li>
              </ul>
              <Link
                href="/entrar"
                className="mt-7 block rounded-full border border-ovy-navy px-4 py-2.5 text-center text-sm font-medium text-ovy-navy hover:bg-ovy-navy hover:text-white"
              >
                Começar gratuitamente
              </Link>
            </div>

            <div className="rounded-2xl border border-ovy-navy bg-ovy-navy p-7 text-white">
              <p className="text-sm font-medium text-violet-200">Pro</p>
              <p className="mt-2 text-4xl font-bold">
                R$ {settings.proPlanPriceBrl.toFixed(2).replace(".", ",")}
                <span className="text-base font-medium text-violet-200">/mês</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-violet-100">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" /> {settings.proPlanMinutes} minutos por mês
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" /> Transcrição fiel e organizada
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" /> Exportação em PDF e Word
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" /> Histórico sincronizado{" "}
                  <InfoTooltip
                    text="Suas transcrições salvas ficam disponíveis em todos os seus dispositivos. Basta entrar na mesma conta para acessar seu histórico."
                    iconClassName="text-violet-200 hover:text-white"
                  />
                </li>
              </ul>
              <Link
                href="/entrar"
                className="mt-7 block rounded-full bg-white px-4 py-2.5 text-center text-sm font-medium text-ovy-navy hover:bg-violet-100"
              >
                Assinar Pro
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Pacotes extras de minutos ficam disponíveis para quem precisar de mais do que o plano oferece.
          </p>
        </div>
      </section>

      {/* Privacidade */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-semibold text-ovy-navy">
            Seus áudios merecem cuidado.
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {[
              "Arquivos de áudio são processados temporariamente.",
              "Áudios são descartados após o processamento, conforme a política de retenção.",
              "Transcrições ficam salvas de forma privada na sua conta.",
              "Acesso protegido por autenticação.",
              "Sincronização segura entre dispositivos.",
            ].map((text) => (
              <div key={text} className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
                <p className="text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            Veja a{" "}
            <Link href="/privacidade" className="underline">
              Política de Privacidade
            </Link>{" "}
            e os{" "}
            <Link href="/termos" className="underline">
              Termos de Uso
            </Link>
            .
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-gray-100 bg-ovy-surface py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-semibold text-ovy-navy">
            Perguntas frequentes
          </h2>
          <div className="mt-10">
            <FaqAccordion items={faqItems} />
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-ovy-navy py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Menos digitação. Mais tempo para o que importa.
          </h2>
          <p className="mt-3 text-violet-200">
            Comece a transformar seus áudios em textos com o Ovy.
          </p>
          <Link
            href="/entrar"
            className="mt-8 inline-block rounded-full bg-violet-500 px-8 py-3.5 text-sm font-medium text-white hover:bg-violet-400"
          >
            Começar gratuitamente
          </Link>
          <p className="mt-3 text-sm text-violet-300">Sem cartão de crédito.</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
