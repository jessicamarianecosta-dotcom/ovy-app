# Ovy — app Android (botão flutuante, versão experimental)

App nativo Kotlin: mantém um botão flutuante arrastável sobre qualquer outro
app (tela de outros apps, não só dentro do Ovy), grava o microfone em blocos
de ~8 segundos e envia cada bloco para o mesmo endpoint de transcrição já
usado pela extensão Chrome (`/api/extension/transcribe-chunk`), reaproveitando
a mesma chave de API pessoal.

## Diferença importante em relação à extensão Chrome

A extensão captura o **áudio da aba** (`tabCapture`). No Android isso não é
possível para qualquer app de forma geral sem ser o próprio app em primeiro
plano — por isso esta versão usa o **microfone do aparelho**, como um
assistente de legendagem ao vivo do ambiente (reuniões, vídeos tocando no
alto-falante, conversas), e não uma captura silenciosa do áudio interno de
outros apps.

## Como abrir e rodar

1. Abra a pasta `android/` no **Android Studio** (não é um projeto Next.js —
   é um projeto Gradle/Kotlin separado, dentro do mesmo repositório).
2. Deixe o Android Studio sincronizar o Gradle (primeira vez pode baixar o
   Android SDK/Build Tools automaticamente).
3. Conecte um celular Android (modo desenvolvedor + depuração USB) ou use um
   emulador, e clique em "Run".
4. No app:
   - Cole a chave de API gerada em `ovy-app.vercel.app/configuracoes` →
     "Chave de API" → "Gerar chave", e toque em "Salvar chave".
   - Toque em "Permitir 'Exibir sobre outros apps'" e autorize na tela do
     sistema.
   - Toque em "Permitir microfone" e autorize.
   - Toque em "Ativar botão flutuante". O botão 🎙 aparece na tela — você
     pode sair do app Ovy e abrir qualquer outro app, o botão continua.
5. Toque no botão para iniciar a legenda (fica roxo/ativo e um painel some
   acima ou abaixo dele com o texto); toque de novo, ou no "✕" do painel,
   para parar. Arraste o botão (sem soltar rápido) para mudar de lugar na
   tela — a posição não é salva entre reinicializações do serviço nesta
   versão inicial.

## Limitações conhecidas (versão experimental, igual à extensão)

- Usa o **microfone**, não o áudio interno de outros apps — funciona bem
  para legendar o que está sendo falado perto do aparelho ou tocando no
  alto-falante, mas não "ouve por dentro" de um app de chamada, por exemplo.
- Sem controle de minutos/plano aplicado ainda (mesma limitação da
  extensão) — é um protótipo para validar a ideia.
- Contas gratuitas do Replicate (sem cartão) têm limite baixo de requisições
  por minuto; o app já pausa e tenta de novo sozinho quando recebe esse erro,
  mas fica mais lento até um método de pagamento ser cadastrado em
  replicate.com/account/billing.
- Não publicado na Play Store — só roda instalado manualmente via Android
  Studio (`Run` em um aparelho, ou gerando um APK em
  `Build > Build Bundle(s) / APK(s) > Build APK(s)`).
- A posição do botão flutuante não é persistida entre reinícios do serviço.
- Em alguns aparelhos/fabricantes, economia de bateria agressiva pode matar
  o serviço em segundo plano; se isso acontecer, é preciso liberar o app nas
  configurações de bateria do sistema (varia por fabricante).
- Não existe versão para iPhone/iOS: a Apple não permite esse tipo de
  sobreposição por cima de outros apps.
