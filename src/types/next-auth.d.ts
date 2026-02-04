import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `auth`, contains information about the active session.
   */
  interface Session {
    user: {
      role?: string
      companyId?: string
      phoneNumber?: string
      bankAccounts?: any[]
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT {
    role?: string
    companyId?: string
    phoneNumber?: string
    bankAccounts?: any[]
  }
}
