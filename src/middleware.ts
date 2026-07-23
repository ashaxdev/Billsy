import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // the `authorized` callback in auth.config.ts already handles the redirect logic,
  // so this can often be left empty, or you can add extra logic here
});

export const config = {
  matcher: ["/dashboard/:path*"],
};