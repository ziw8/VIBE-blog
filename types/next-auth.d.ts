import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      githubLogin?: string | null;
      isAdmin?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    githubLogin?: string | null;
    isAdmin?: boolean;
  }
}
