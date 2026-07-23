import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await dbConnect();
        const business = await Business.findOne({
          email: (credentials.email as string).toLowerCase(),
        });
        if (!business) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          business.passwordHash
        );
        if (!valid) return null;

        return {
          id: business._id.toString(),
          email: business.email,
          name: business.businessName,
          slug: business.slug,
          plan: business.plan?.tier ?? "free",
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.businessId = user.id;
        token.slug = (user as any).slug;
        token.plan = (user as any).plan;
      }
      if (trigger === "update" && token.businessId) {
        await dbConnect();
        const business = await Business.findById(token.businessId).lean();
        if (business) token.plan = business.plan?.tier ?? "free";
      }
      return token;
    },
  },
});