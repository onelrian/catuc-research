import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { 
  usersTable, 
  accountsTable, 
  sessionsTable, 
  verificationTokensTable 
} from "@/lib/schema";
import { eq } from "drizzle-orm";

/**
 * Auth.js Configuration.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Cast the entire adapter result to any to bypass complex Drizzle/Auth type mismatches
  adapter: DrizzleAdapter(db as any, {
    usersTable: usersTable as any,
    accountsTable: accountsTable as any,
    sessionsTable: sessionsTable as any,
    verificationTokensTable: verificationTokensTable as any,
  }) as any,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        const adminEmails = (process.env.ADMIN_EMAILS || "")
          .split(",")
          .map((e) => e.trim().toLowerCase());
        
        if (adminEmails.includes(user.email.toLowerCase())) {
          await db
            .update(usersTable)
            .set({ isAdmin: true })
            .where(eq(usersTable.email, user.email.toLowerCase()));
        }
      }
      return true;
    },
    async session({ session, user }: { session: any; user: any }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.isAdmin = user.isAdmin ?? false;
      }
      return session;
    },
  },
});
