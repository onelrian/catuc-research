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
  trustHost: true,
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      if (session.user) {
        session.user.id = user.id;

        // Check if this user should be an admin based on the ADMIN_EMAILS env var.
        // We do this in the session callback (not signIn) to avoid a race condition:
        // on first OAuth login, the adapter creates the user row AFTER signIn fires,
        // so an UPDATE in signIn hits zero rows and silently fails.
        const adminEmails = (process.env.ADMIN_EMAILS || "")
          .split(",")
          .map((e) => e.trim().toLowerCase());

        const [freshUser] = await db
          .select({ isAdmin: usersTable.isAdmin, email: usersTable.email })
          .from(usersTable)
          .where(eq(usersTable.id, user.id));

        if (freshUser) {
          // Auto-promote if email matches and not already admin
          if (!freshUser.isAdmin && freshUser.email && adminEmails.includes(freshUser.email.toLowerCase())) {
            await db
              .update(usersTable)
              .set({ isAdmin: true })
              .where(eq(usersTable.id, user.id));
            session.user.isAdmin = true;
          } else {
            session.user.isAdmin = freshUser.isAdmin ?? false;
          }
        } else {
          session.user.isAdmin = false;
        }
      }
      return session;
    },
  },
});
