import { NextResponse } from "next/server";

// Link curto e fixo pro .apk mais recente do app Android (compilado
// automaticamente pelo GitHub Actions a cada atualização).
const APK_URL =
  "https://github.com/jessicamarianecosta-dotcom/ovy-app/releases/download/android-latest/app-debug.apk";

export async function GET() {
  return NextResponse.redirect(APK_URL);
}
