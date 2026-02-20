"use client";

import { signIn, signOut } from "next-auth/react";

export function SignIn({ disabled }: { disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        disabled={disabled}
        className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Sign in with Google
      </button>
      <p className="text-sm text-zinc-500">Only @nftfi.com accounts are allowed.</p>
    </div>
  );
}

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="px-3 py-1.5 text-sm border border-zinc-300 rounded-lg hover:bg-zinc-100 transition"
    >
      Sign out
    </button>
  );
}
