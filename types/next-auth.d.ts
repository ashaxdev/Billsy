import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    plan?: string
    slug?: string
    businessId?: string
  }

  interface Session {
    user: {
      id?: string
      slug?: string
      plan?: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    plan?: string
    slug?: string
    businessId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    businessId?: string
    slug?: string
    plan?: string
  }
}