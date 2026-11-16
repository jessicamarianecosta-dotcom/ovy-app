import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // O provider Credentials (login por senha) só funciona com sessão em JWT
  // — ele não passa pelo fluxo de criação de sessão do adapter como OAuth
  // ou e-mail fazem. Com "database" aqui, o login por senha "funcionava"
  // (sem erro) mas nunca criava sessão de verdade, e a pessoa voltava pro
  // /entrar como se nada tivesse acontecido. O adapter continua cuidando
  // de usuários/contas/tokens normalmente; só a sessão vira um cookie JWT.
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
  providers: [
    // Login nativo com e-mail/senha. O Google foi removido por enquanto;
    // volta a ser fácil de reativar (bastava adicionar o provider de novo),
    // já que o adapter/DB não dependem dele.
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const user = await db.query.users.findFirst({ where: eq(users.email, email) });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_EMAIL_FROM ?? "Ovy <onboarding@resend.dev>",
    }),
  ],
  pages: {
    signIn: "/entrar",
    verifyRequest: "/entrar/verifique-seu-email",
  },
});
