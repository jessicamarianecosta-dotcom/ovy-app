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
2. **Importante:** clique uma vez no ícone do Ovy na barra de extensões
   (o popup abre e pode fechar na hora). Isso precisa ser feito **uma vez
   por aba** — é uma exigência de segurança do próprio Chrome antes de
   liberar a captura de áudio dessa aba.
3. Em qualquer mensagem de áudio, vai aparecer um botão 📝 logo ao lado do
   player. Clique nele.
4. A extensão aperta o play da mensagem automaticamente e grava o áudio
   que sai da aba (funciona mesmo com o volume baixo — não precisa ouvir
   pra transcrever). Ela para de gravar sozinha assim que a mensagem
   termina de tocar.
5. O texto transcrito e organizado aparece logo abaixo da mensagem.

## Como funciona por baixo dos panos

O WhatsApp Web usa um player de áudio totalmente customizado — sem tag
`<audio>` — e decodifica o som dentro de um Service Worker, invisível pra
qualquer script injetado na página. Por isso a extensão não tenta "espiar"
o código deles: ela usa a permissão `tabCapture` do Chrome pra gravar o
áudio que já sai pronto da aba (depois de qualquer descriptografia/
decodificação interna), processando isso num documento `offscreen` (exigido
pelo Manifest V3) e enviando o resultado pro Ovy transcrever.

## Limitações conhecidas

- Funciona só no **web.whatsapp.com** — não em outros sites, nem no
  WhatsApp Desktop (app nativo) ou no celular (pra isso, use o app Android
  com "compartilhar áudio").
- Precisa clicar no ícone do Ovy uma vez por aba antes de usar o botão 📝
  (exigência do Chrome, não dá pra pular).
- Como o WhatsApp Web muda a estrutura da página de vez em quando, o botão
  pode parar de aparecer depois de uma atualização deles — avise se isso
  acontecer, pra eu ajustar.
- Mesmo limite de 2 minutos por áudio e de minutos do seu plano que vale
  pra qualquer transcrição no Ovy.
- Não publicada na Chrome Web Store; funciona só em modo desenvolvedor,
  carregada manualmente.
