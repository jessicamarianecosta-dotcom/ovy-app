# Ovy — Legenda ao vivo (extensão Chrome, versão experimental)

Botão flutuante que aparece em qualquer site, captura o áudio da aba
atual e mostra uma legenda com o texto transcrito, em blocos de ~8
segundos (reaproveita o mesmo motor de transcrição do app Ovy).

## Como instalar (modo desenvolvedor)

1. Gere sua chave de API em https://ovy-app.vercel.app/configuracoes
   (card "Chave de API" → "Gerar chave").
2. Abra `chrome://extensions` no Chrome.
3. Ative o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e selecione esta pasta (`extension/`).
5. Clique no ícone do Ovy na barra de extensões e cole a chave de API gerada no passo 1.

## Como usar

1. Em qualquer site com áudio tocando (ex: uma videochamada, um vídeo),
   clique no botão flutuante roxo/azul no canto inferior direito.
2. O Chrome vai pedir para você escolher a aba cuja aba terá o áudio
   compartilhado — confirme a própria aba atual.
3. A legenda aparece acima do botão, acumulando o texto a cada ~8 segundos.
4. Clique no "✕" do painel para fechar e parar a captura.

## Limitações conhecidas (versão experimental)

- A legenda tem um atraso de alguns segundos (não é tempo real de verdade).
- Não há controle de minutos/limite de plano aplicado a essa funcionalidade
  ainda — é só um protótipo para validar a ideia.
- Pode não funcionar em sites que bloqueiam captura de aba por política
  própria, ou em chamadas de voz que usam áudio criptografado localmente
  de forma que o Chrome não consegue capturar via `tabCapture`.
- A extensão não está publicada na Chrome Web Store; funciona só em modo
  desenvolvedor, carregada manualmente.
