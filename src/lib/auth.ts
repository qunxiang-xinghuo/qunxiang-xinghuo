import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      level: number;
      sparkCount: number;
    };
  }

  interface User {
    id: string;
    level: number;
    sparkCount: number;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          // For demo purposes, create a user if not found
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          const newUser = await db.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split("@")[0],
              level: 1,
              sparkCount: 0,
            },
          });
          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            level: newUser.level,
            sparkCount: newUser.sparkCount,
          };
        }

        // In a real app, you would verify the password here
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          level: user.level,
          sparkCount: user.sparkCount,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.level = user.level;
        token.sparkCount = user.sparkCount;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.level = token.level as number;
        session.user.sparkCount = token.sparkCount as number;
      }
      return session;
    },
  },
};