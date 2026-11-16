import Image from "next/image";
import Link from "next/link";
import { signInWithEmail, signInWithPassword, signUpWithPassword } from "./actions";

export default async function EntrarPage({
  searchParams,
}: PageProps<"/entrar">) {
  const params = await searchParams;
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : "/app";
  const mode = params.cadastro !== undefined ? "cadastro" : "entrar";
  const erro = typeof params.erro === "string" ? params.erro : null;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center">
            <Image src="/brand/ovy-logo.png" alt="Ovy" width={1181} height={1181} className="h-10 w-10" />
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-ovy-navy">
            {mode === "cadastro" ? "Crie sua conta" : "Entre na sua conta"}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Falou, transcreveu. Sem digitação.</p>
        </div>

        {erro && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {erro}
          </div>
        )}

        {mode === "cadastro" ? (
          <form action={signUpWithPassword} className="mt-6 space-y-3">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <input
              type="email"
              name="email"
              required
              placeholder="seu@email.com"
              className="w-full rounded-full border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
            />
            <input
              type="tel"
              name="phone"
              placeholder="Telefone (opcional)"
              className="w-full rounded-full border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
            />
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="Crie uma senha (mín. 6 caracteres)"
              className="w-full rounded-full border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-ovy-navy px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Criar conta
            </button>
          </form>
        ) : (
          <form action={signInWithPassword} className="mt-6 space-y-3">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <input
              type="email"
              name="email"
              required
              placeholder="seu@email.com"
              className="w-full rounded-full border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
            />
            <input
              type="password"
              name="password"
              required
              placeholder="Sua senha"
              className="w-full rounded-full border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-ovy-navy px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Entrar
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-neutral-500">
          {mode === "cadastro" ? (
            <>
              Já tem conta?{" "}
              <Link href="/entrar" className="font-medium text-ovy-navy underline">
                Entrar
              </Link>
            </>
          ) : (
            <>
              Ainda não tem conta?{" "}
              <Link href="/entrar?cadastro" className="font-medium text-ovy-navy underline">
                Criar conta
              </Link>
            </>
          )}
        </p>

        <div className="my-6 flex items-center gap-3 text-xs text-neutral-400">
          <div className="h-px flex-1 bg-neutral-200" />
          ou entre sem senha
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <form action={signInWithEmail} className="space-y-3">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <input
            type="email"
            name="email"
            required
            placeholder="seu@email.com"
            className="w-full rounded-full border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
          />
          <button
            type="submit"
            className="w-full rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          >
            Enviar link de acesso
          </button>
        </form>
      </div>
    </div>
  );
}
