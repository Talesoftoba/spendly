import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    avatarUrl?: string | null;
  }
  interface Session {
    user: {
      id: string;
      avatarUrl?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    avatarUrl?: string | null;
  }
}