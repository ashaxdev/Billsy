import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [], // filled in by the full config in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isDashboard) {
        return isLoggedIn; // false triggers redirect to signIn page
      }
      return true;
    },
    // Runs on sign-in and on every subsequent request.
    // `user` is only populated on first sign-in (from your provider/adapter).
    async jwt({ token, user }) {
      if (user) {
        token.businessId = user.id ?? user.businessId;
        token.slug = user.slug;
        token.plan = user.plan;
      }
      return token;
    },
    // Runs whenever the session is checked (e.g. useSession(), auth()).
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.businessId as string;
        session.user.slug = token.slug as string;
        session.user.plan = token.plan as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;