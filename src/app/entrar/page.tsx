import Image from "next/image";
import Link from "next/link";
import { signInWithGoogle, signInWithEmail } from "./actions";

export default async function EntrarPage({
  searchParams,
}: PageProps<"/entrar">) {
  const params = await searchParams;
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : "/app";

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center">
            <Image src="/brand/ovy-logo.png" alt="Ovy" width={1181} height={1181} className="h-10 w-10" />
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-ovy-navy">Entre na sua conta</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Falou, transcreveu. Sem digitação.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signInWithGoogle(callbackUrl);
          }}
          className="mt-6"
        >
          <button
            type="submit"
            className="w-full rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          >
            Continuar com Google
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-neutral-400">
          <div className="h-px flex-1 bg-neutral-200" />
          ou
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
            className="w-full rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Enviar link de acesso
          </button>
        </form>
      </div>
    </div>
  );
}
