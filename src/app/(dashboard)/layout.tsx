import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mic, History, CreditCard, Settings, ShieldCheck, LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { FloatingRecordButton } from "@/components/floating-record-button";
import { signOutAction } from "./actions";

const NAV_ITEMS = [
  { href: "/app", label: "Início", icon: Mic },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/plano", label: "Meu plano", icon: CreditCard },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  return (
    <div className="flex flex-1">
      <aside className="hidden w-60 flex-col border-r border-neutral-200 bg-white p-4 sm:flex">
        <Link href="/app" className="flex items-center px-2">
          <Image src="/brand/ovy-logo.png" alt="Ovy" width={1181} height={1181} className="h-8 w-8" />
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          {user.isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>
        <form action={signOutAction} className="mt-auto">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </form>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 sm:hidden">
          <Link href="/app" className="flex items-center">
            <Image src="/brand/ovy-logo.png" alt="Ovy" width={1181} height={1181} className="h-7 w-7" />
          </Link>
          <nav className="flex items-center gap-3 text-xs">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link key={href} href={href} className="text-neutral-500">
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 bg-neutral-50 p-4 sm:p-8">{children}</main>
      </div>
      <FloatingRecordButton />
    </div>
  );
}
