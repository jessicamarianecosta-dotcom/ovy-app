import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ovy — Sua voz em texto",
    short_name: "Ovy",
    description:
      "Transforme áudios em textos organizados, editáveis e prontos para usar.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F7FB",
    theme_color: "#111B36",
    lang: "pt-BR",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Faz o Ovy, quando instalado como PWA, aparecer na própria tela de
    // compartilhar do Android (ex: WhatsApp → ⋮ → Compartilhar → Ovy) —
    // sem instalar nenhum app nativo, sem "fontes desconhecidas". Suportado
    // no Chrome/Android; não existe equivalente no Safari/iOS ainda.
    // O tipo oficial do Next não inclui share_target, mas o campo é válido
    // na especificação do Web App Manifest.
    share_target: {
      action: "/api/share-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        files: [
          {
            name: "audio",
            accept: ["audio/*", "application/ogg", "application/octet-stream"],
          },
        ],
      },
    },
  } as MetadataRoute.Manifest;
}
