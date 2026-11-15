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

**Importante:** o Chrome só libera a captura de áudio de uma aba quando você
clica no **ícone da extensão na barra de ferramentas** (ou num atalho de
teclado/menu de contexto da extensão) — um clique só no botão flutuante da
própria página **não** conta como autorização para o Chrome, por segurança.
Por isso, para *iniciar* a legenda:

1. Clique no ícone do Ovy na barra de extensões.
2. Clique em **"Ativar legenda nesta aba"** dentro do popup.
3. O botão flutuante 🎙 na página fica roxo/ativo e a legenda aparece acima
   dele, acumulando o texto a cada ~8 segundos.
4. Para parar: clique de novo no botão flutuante, no "✕" do painel, ou volte
   no popup e clique em "Parar legenda nesta aba".

Se você clicar direto no botão flutuante sem nunca ter aberto o popup antes
naquela aba, vai aparecer um aviso pedindo para usar o ícone da extensão —
isso é uma limitação de segurança do próprio Chrome, não um bug.

## Limitações conhecidas (versão experimental)

- A legenda tem um atraso de alguns segundos (não é tempo real de verdade).
- Não há controle de minutos/limite de plano aplicado a essa funcionalidade
  ainda — é só um protótipo para validar a ideia.
- Pode não funcionar em sites que bloqueiam captura de aba por política
  própria, ou em chamadas de voz que usam áudio criptografado localmente
  de forma que o Chrome não consegue capturar via `tabCapture`.
- **Contas gratuitas do Replicate (sem cartão cadastrado) têm um limite bem
  baixo de requisições por minuto.** Se aparecer "Limite de requisições
  atingido", adicione um método de pagamento em replicate.com/account/billing
  para liberar o limite normal — a extensão já pausa e tenta de novo sozinha,
  mas vai ficar lenta até isso ser resolvido.
- A extensão não está publicada na Chrome Web Store; funciona só em modo
  desenvolvedor, carregada manualmente.
