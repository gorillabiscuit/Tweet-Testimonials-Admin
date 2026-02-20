import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignIn } from "@/components/SignIn";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/dashboard");
  }
  const { error } = await searchParams;
  const hasGoogleAuth = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  );
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-zinc-50">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Tweet Testimonials Admin</h1>
        <p className="text-zinc-600">Sign in with your NFTfi Google account to manage testimonials.</p>
        {(!hasGoogleAuth || error === "OAuthSignin") && (
          <div className="text-left rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
            <p className="font-medium">Google sign-in is not configured</p>
            <p className="mt-2 text-amber-800">
              Add <code className="bg-amber-100 px-1 rounded">GOOGLE_CLIENT_ID</code> and{" "}
              <code className="bg-amber-100 px-1 rounded">GOOGLE_CLIENT_SECRET</code> to a{" "}
              <code className="bg-amber-100 px-1 rounded">.env.local</code> file (or <code className="bg-amber-100 px-1 rounded">.env</code>), then restart the dev server.
            </p>
            <p className="mt-2 text-amber-800">
              Create OAuth credentials at{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Google Cloud Console
              </a>{" "}
              and set the redirect URI to{" "}
              <code className="bg-amber-100 px-1 rounded text-xs">http://localhost:3000/api/auth/callback/google</code>.
            </p>
          </div>
        )}
        <SignIn disabled={!hasGoogleAuth} />
      </div>
    </main>
  );
}
