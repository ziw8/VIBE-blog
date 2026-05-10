import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, authProviderOptions, signIn } from "@/auth";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Sign in",
  description: "GitHub 또는 Google로 로그인합니다.",
};

const enabledProviders = authProviderOptions.filter((provider) => provider.enabled);

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <Container>
      <div className="space-y-8">
        <Reveal>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-black dark:text-white">
              Sign in
            </h1>
            <p className="text-black/60 dark:text-white/60">
              GitHub 또는 Google 계정으로 로그인합니다.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          {enabledProviders.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {enabledProviders.map((provider) => (
                <form
                  key={provider.id}
                  action={async () => {
                    "use server";

                    await signIn(provider.id, { redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="text-black underline decoration-black/15 underline-offset-2 transition-colors duration-300 ease-in-out hover:decoration-black/25 dark:text-white dark:decoration-white/30 dark:hover:decoration-white/50"
                  >
                    Continue with {provider.label}
                  </button>
                </form>
              ))}
            </div>
          ) : (
            <div className="space-y-2 text-sm text-black/60 dark:text-white/60">
              <p>아직 로그인 공급자가 설정되지 않았습니다.</p>
              <p>
                GitHub는 <code>AUTH_GITHUB_ID</code>,{" "}
                <code>AUTH_GITHUB_SECRET</code>을 설정하면 활성화됩니다.
                Google은 <code>AUTH_GOOGLE_ID</code>,{" "}
                <code>AUTH_GOOGLE_SECRET</code>을 설정하면 활성화됩니다.
              </p>
            </div>
          )}
        </Reveal>
      </div>
    </Container>
  );
}
