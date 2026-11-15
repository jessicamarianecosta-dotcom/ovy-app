# Ovy — app Android (compartilhar áudio do WhatsApp, sem precisar ouvir)

App nativo Kotlin bem pequeno: você recebe um áudio no WhatsApp,
compartilha ele com o app "Ovy" (como se fosse encaminhar para um contato) e
o Ovy devolve o texto transcrito — sem você precisar tocar/ouvir o áudio.

Por trás, ele chama o mesmo endpoint de transcrição completa do site
(`/api/transcribe`), que agora também aceita a chave de API pessoal (a
mesma usada pela extensão Chrome), além do login por sessão do navegador. A
transcrição é salva no seu histórico normalmente, consumindo os minutos do
seu plano como qualquer outra transcrição.

## Antes de tudo: você talvez nem precise deste app

O próprio WhatsApp tem transcrição de mensagens de voz nativa e gratuita:
**Configurações → Conversas → Transcrições de mensagens de voz** (disponível
em português). Se isso já resolver seu caso, não precisa instalar nada.

Este app Ovy faz sentido quando você quer o texto **organizado pelo Ovy**
(removendo vícios de fala, pontuação corrigida) e **salvo no seu histórico**
junto com as outras transcrições.

## Como abrir e rodar

1. Abra a pasta `android/` no **Android Studio** (projeto Gradle/Kotlin
   separado do Next.js, dentro do mesmo repositório).
2. Deixe o Gradle sincronizar (primeira vez pode baixar SDK/Build Tools).
3. Conecte um celular Android (depuração USB) ou use um emulador e clique
   em "Run".
4. No app, cole a chave de API gerada em
   `ovy-app.vercel.app/configuracoes` → "Chave de API" → "Gerar chave", e
   toque em "Salvar chave" (só precisa fazer isso uma vez).

## Como usar

1. No WhatsApp, mantenha pressionado um áudio recebido (mobile; WhatsApp
   Web/Desktop não tem essa opção de compartilhar nativamente — nesse caso
   baixe o áudio e suba manualmente em ovy-app.vercel.app).
2. Toque em compartilhar/encaminhar (ícone de seta ou "⋮" → "Compartilhar").
   O **Ovy aparece fixado/em destaque** na primeira fileira da tela de
   compartilhar (Direct Share do Android) — não precisa rolar a lista de
   apps pra achar.
3. Uma tela simples abre, mostra "Transcrevendo o áudio…" e, quando
   terminar, o texto já organizado — com botões para copiar ou abrir a
   transcrição completa no site.

### Sobre o Direct Share

O destaque na tela de compartilhar usa o recurso oficial do Android
(`android.app.shortcuts` + `share-target` em `res/xml/shortcuts.xml`) — não
é automação nem leitura da tela do WhatsApp, só um atalho declarado que o
próprio sistema prioriza. Pode levar alguns compartilhamentos para o
Android "aprender" a priorizar o Ovy nessa lista, dependendo do fabricante
do aparelho.

## Limitações conhecidas

- Funciona só com áudios já recebidos/baixados no aparelho (o que é o caso
  normal de mensagens de voz do WhatsApp) — não com áudio tocando ao vivo.
- Mesmo limite de 4 minutos por áudio e de minutos do seu plano que vale
  para qualquer transcrição no Ovy.
- Não publicado na Play Store — instale manualmente via Android Studio
  (`Run` em um aparelho, ou `Build > Build Bundle(s) / APK(s) > Build
  APK(s)` para gerar um `.apk` e instalar sem fio).
- Sem versão para iPhone/iOS por ora (o compartilhamento nativo do iOS
  também permitiria algo parecido, mas ainda não foi construído).
