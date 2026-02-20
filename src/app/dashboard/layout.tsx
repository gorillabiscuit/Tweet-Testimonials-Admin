import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignIn";
import Link from "next/link";
import { UnsavedChangesProvider } from "@/contexts/UnsavedChangesContext";
import { DashboardLink } from "@/components/DashboardLink";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/");
  }
  return (
    <UnsavedChangesProvider>
      <div className="min-h-screen bg-zinc-50">
        <header className="border-b border-zinc-200 bg-white px-6 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-4">
            <DashboardLink />
          <Link
            href="/dashboard/testimonials/new"
            className="inline-flex items-center px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition"
          >
            Add testimonial
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-700">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>
        <main className="p-6">{children}</main>
      </div>
    </UnsavedChangesProvider>
  );
}
