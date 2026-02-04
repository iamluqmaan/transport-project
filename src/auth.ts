import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import connectDB from "@/lib/db"
import User from "@/models/User"
import Admin from "@/models/Admin"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          await connectDB();
          const { email, password } = parsedCredentials.data;
          
          let user = await User.findOne({ email });
          let isAdmin = false;

          if (!user) {
            // Check Admin collection
            const admin = await Admin.findOne({ email });
            if (admin) {
              user = admin;
              isAdmin = true;
            }
          }
          
          if (!user) return null;
          
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) {
             return {
                 ...user.toObject(),
                 id: user._id.toString(),
                 role: isAdmin ? user.role : (user.role || 'CUSTOMER'), 
                 isAdmin: isAdmin,
                 companyId: user.companyId,
                 phoneNumber: user.phoneNumber,
                 bankAccounts: user.bankAccounts || []
             };
          }
        }

        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string | undefined;
        session.user.phoneNumber = token.phoneNumber as string | undefined;
        session.user.bankAccounts = token.bankAccounts as any[];
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.companyId = (user as any).companyId?.toString();
        token.phoneNumber = (user as any).phoneNumber;
        token.bankAccounts = (user as any).bankAccounts;
      }
      return token;
    }
  },
  session: {
    strategy: "jwt",
  },
})
