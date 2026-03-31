import { DefaultSession } from "next-auth";

declare module "next-auth" {

   interface User {
    avatarUrl?: string; 
  }
  interface Session {
    user: {
      id: string;
      avatarUrl?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    avatarUrl?: string;
  }
}