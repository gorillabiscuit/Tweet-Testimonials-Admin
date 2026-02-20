"use client";

import { useState } from "react";

export function ExportButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<"success" | "error" | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/export", { credentials: "include" });
      if (!res.ok) {
        setMessage("error");
        setLoading(false);
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+)"/);
      const filename = match?.[1] ?? "nftfi-testimonials.zip";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("success");
    } catch {
      setMessage("error");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition"
      >
        {loading ? "Exporting…" : "Export testimonials bundle"}
      </button>
      {message === "success" && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800 max-w-md">
          <p className="font-medium">Bundle downloaded.</p>
          <p className="mt-1 text-green-700">
            Give this zip to devs to commit into the website repo under{" "}
            <code className="bg-green-100 px-1 rounded">/public</code> and{" "}
            <code className="bg-green-100 px-1 rounded">/src/data</code> (or{" "}
            <code className="bg-green-100 px-1 rounded">/public/data</code>).
          </p>
        </div>
      )}
      {message === "error" && (
        <p className="text-sm text-red-600">Export failed. Try again.</p>
      )}
    </div>
  );
}
