// lib/auth.ts
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import  { prisma }  from "./prisma" // Make sure this path is correct

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),  // Add this line
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database",  // Change from "jwt" to "database"
  },
  callbacks: {
    async session({ session, user }) {  // Updated to use user from database
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
      else if (url.startsWith("/")) return `${baseUrl}${url}`
      return baseUrl
    }
  }
}