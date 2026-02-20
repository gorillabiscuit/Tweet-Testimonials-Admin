"use client";

import { useRouter } from "next/navigation";
import { useUnsavedChanges } from "@/contexts/UnsavedChangesContext";

export function DashboardLink() {
  const router = useRouter();
  const ctx = useUnsavedChanges();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (ctx?.hasUnsavedChanges) {
      e.preventDefault();
      if (!confirm("You will lose your unsaved changes. Leave anyway?")) return;
      router.push("/dashboard");
    }
  };

  return (
    <a
      href="/dashboard"
      onClick={handleClick}
      className="font-medium text-zinc-900 hover:text-zinc-600"
    >
      Dashboard
    </a>
  );
}
