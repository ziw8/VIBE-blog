import NextAuth, { type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

type AdminIdentity = {
  email?: string | null;
  githubLogin?: string | null;
};

const githubEnabled = Boolean(
  process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
);
const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

const providers: NextAuthConfig["providers"] = [];

if (githubEnabled) {
  providers.push(GitHub);
}

if (googleEnabled) {
  providers.push(Google);
}

export const authProviderOptions = [
  { id: "github", label: "GitHub", enabled: githubEnabled },
  { id: "google", label: "Google", enabled: googleEnabled },
] as const;

function splitEnvList(value?: string) {
  return (
    value
      ?.split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean) ?? []
  );
}

export function isAdminIdentity({ email, githubLogin }: AdminIdentity) {
  const adminEmails = splitEnvList(process.env.ADMIN_EMAILS);
  const adminGithubLogins = splitEnvList(process.env.ADMIN_GITHUB_LOGINS);
  const normalizedEmail = email?.toLowerCase() ?? "";
  const normalizedGithubLogin = githubLogin?.toLowerCase() ?? "";

  return (
    (normalizedEmail !== "" && adminEmails.includes(normalizedEmail)) ||
    (normalizedGithubLogin !== "" &&
      adminGithubLogins.includes(normalizedGithubLogin))
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "local-development-auth-secret"
      : undefined),
  trustHost: true,
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    jwt({ account, profile, token }) {
      if (account?.provider === "github" && profile && "login" in profile) {
        token.githubLogin =
          typeof profile.login === "string" ? profile.login : null;
      }

      const githubLogin =
        typeof token.githubLogin === "string" ? token.githubLogin : null;

      token.isAdmin = isAdminIdentity({
        email: token.email,
        githubLogin,
      });

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.githubLogin =
          typeof token.githubLogin === "string" ? token.githubLogin : null;
        session.user.isAdmin = Boolean(token.isAdmin);
      }

      return session;
    },
  },
});
