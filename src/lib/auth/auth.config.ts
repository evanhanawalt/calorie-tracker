import type { AuthConfig } from "@auth/core";
import { setEnvDefaults } from "@auth/core";
import Google from "@auth/core/providers/google";
import { AUTH_BASE_PATH } from "./authPaths";
import { upsertGoogleUser } from "../../db/users";

/** Server env: `process.env` (local `.env`, Vercel, etc.). */
function serverEnv(name: string): string | undefined {
  const v = process.env[name];
  if (typeof v === "string" && v.length > 0) {
    return v;
  }
  return undefined;
}

export const authConfig: AuthConfig = {
  basePath: AUTH_BASE_PATH,
  trustHost: true,
  secret: serverEnv("AUTH_SECRET"),
  providers: [
    Google({
      clientId: serverEnv("GOOGLE_CLIENT_ID"),
      clientSecret: serverEnv("GOOGLE_CLIENT_SECRET"),
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    signIn({ account }) {
      return account?.provider === "google";
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" && account.providerAccountId) {
        const email =
          (profile as { email?: string } | undefined)?.email ??
          (typeof user?.email === "string" ? user.email : null) ??
          (typeof token.email === "string" ? token.email : null);
        if (!email) {
          return token;
        }
        const name =
          (profile as { name?: string } | undefined)?.name ??
          (typeof user?.name === "string" ? user.name : null) ??
          (typeof token.name === "string" ? token.name : null);
        const image =
          (profile as { picture?: string } | undefined)?.picture ??
          (typeof user?.image === "string" ? user.image : null) ??
          (typeof token.picture === "string" ? token.picture : null);
        const { id } = await upsertGoogleUser({
          googleSub: account.providerAccountId,
          email,
          name,
          image,
        });
        token.neonUserId = id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.neonUserId === "string") {
        session.user.id = token.neonUserId;
      }
      return session;
    },
  },
};

setEnvDefaults(
  {
    ...process.env,
    AUTH_SECRET: serverEnv("AUTH_SECRET"),
    AUTH_URL: serverEnv("AUTH_URL"),
  } as unknown as NodeJS.ProcessEnv,
  authConfig,
  true,
);
