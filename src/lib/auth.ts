import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const NFTFI_DOMAIN = "@nftfi.com";

const hasGoogleCredentials =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

export const authOptions: NextAuthOptions = {
  providers: [
    ...(hasGoogleCredentials
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    signIn({ user }) {
      const email = user?.email ?? "";
      if (!email.endsWith(NFTFI_DOMAIN)) {
        return false;
      }
      return true;
    },
    session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  return session;
}
