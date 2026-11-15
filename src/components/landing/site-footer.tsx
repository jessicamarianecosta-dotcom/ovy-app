import Link from "next/link";

const COLUMNS = [
  {
    title: "Produto",
    links: [
      { href: "#como-funciona", label: "Como funciona" },
      { href: "#recursos", label: "Recursos" },
      { href: "#planos", label: "Planos" },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { href: "#faq", label: "Perguntas frequentes" },
      { href: "mailto:contato@ovyapp.com.br", label: "Contato" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacidade", label: "Política de Privacidade" },
      { href: "/termos", label: "Termos de Uso" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Link href="/" className="text-lg font-semibold text-ovy-navy">
              Ovy
            </Link>
            <p className="mt-2 text-sm text-gray-500">Sua voz em texto.</p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-ovy-navy">{column.title}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-gray-500 hover:text-ovy-navy">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 text-xs text-gray-400">
          © {new Date().getFullYear()} Ovy. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
