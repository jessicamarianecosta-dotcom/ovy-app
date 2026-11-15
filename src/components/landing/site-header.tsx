import Link from "next/link";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#recursos", label: "Recursos" },
  { href: "#planos", label: "Planos" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ovy-navy">
          Ovy
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-ovy-navy">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/entrar"
            className="hidden text-sm font-medium text-gray-600 hover:text-ovy-navy sm:block"
          >
            Entrar
          </Link>
          <Link
            href="/entrar"
            className="rounded-full bg-ovy-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-600"
          >
            Começar gratuitamente
          </Link>
        </div>
      </div>
    </header>
  );
}
