# Ovy — Transcrever WhatsApp Web (extensão Chrome)

Adiciona um botão **📝** ao lado de cada mensagem de áudio no
**web.whatsapp.com**. Clique nele pra transcrever só aquela mensagem —
nada de "ficar ouvindo" a página o tempo todo.

## Como instalar (modo desenvolvedor)

1. Gere sua chave de API em https://ovy-app.vercel.app/configuracoes
   (card "Chave de API" → "Gerar chave").
2. Abra `chrome://extensions` no Chrome.
3. Ative o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e selecione esta pasta (`extension/`).
5. Clique no ícone do Ovy na barra de extensões e cole a chave de API.

## Como usar

1. Abra **web.whatsapp.com** normalmente.
2. Em qualquer mensagem de áudio, vai aparecer um botão 📝 logo ao lado do
   player. Clique nele.
3. Em alguns casos a extensão precisa simular um toque no play pra o
   WhatsApp carregar o áudio (ele mantém mutado e pausa na hora — você não
   ouve nada) antes de conseguir ler o arquivo.
4. O texto transcrito e organizado aparece logo abaixo da mensagem.

## Limitações conhecidas

- Funciona só no **web.whatsapp.com** — não em outros sites, nem no
  WhatsApp Desktop (app nativo) ou no celular (pra isso, use o app Android
  com "compartilhar áudio").
- Como o WhatsApp Web muda a estrutura da página de vez em quando, o botão
  pode parar de aparecer depois de uma atualização deles — avise se isso
  acontecer, pra eu ajustar.
- Mesmo limite de 4 minutos por áudio e de minutos do seu plano que vale
  pra qualquer transcrição no Ovy.
- Não publicada na Chrome Web Store; funciona só em modo desenvolvedor,
  carregada manualmente.
