"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { testimonialSchema, type TestimonialFormValues } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { TweetPreview } from "@/components/TweetPreview";
import { useUnsavedChanges } from "@/contexts/UnsavedChangesContext";

type Testimonial = {
  id: string;
  tweetUrl: string;
  authorName: string;
  handle: string;
  tweetText: string;
  displayText: string;
  date: string;
  columnIndex: number;
  sortOrder: number;
  isActive: boolean;
  avatarFileName?: string;
};

const defaultValues: TestimonialFormValues = {
  tweetUrl: "",
  authorName: "",
  handle: "",
  tweetText: "",
  displayText: "",
  date: new Date().toISOString().slice(0, 10),
  columnIndex: 0,
  sortOrder: 0,
  isActive: true,
};

export function TestimonialForm({
  testimonial,
  mode,
}: {
  testimonial?: Testimonial | null;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const unsavedCtx = useUnsavedChanges();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [fetchedAvatarToken, setFetchedAvatarToken] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [existingList, setExistingList] = useState<Testimonial[]>([]);
  const [insertPosition, setInsertPosition] = useState<"top" | "bottom" | string>("bottom");

  useEffect(() => {
    if (mode === "create") {
      fetch("/api/testimonials")
        .then((r) => r.ok ? r.json() : [])
        .then((data) => setExistingList(Array.isArray(data) ? data : []))
        .catch(() => setExistingList([]));
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "create" || !unsavedCtx) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedCtx.hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [mode, unsavedCtx?.hasUnsavedChanges]);

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: testimonial
      ? {
          tweetUrl: testimonial.tweetUrl,
          authorName: testimonial.authorName,
          handle: testimonial.handle,
          tweetText: testimonial.tweetText,
          displayText: testimonial.displayText ?? "",
          date: testimonial.date,
          columnIndex: testimonial.columnIndex,
          sortOrder: testimonial.sortOrder,
          isActive: testimonial.isActive,
        }
      : defaultValues,
  });

  const onSubmit = async (data: TestimonialFormValues) => {
    setSubmitError(null);
    const formData = new FormData();
    formData.set("tweetUrl", data.tweetUrl);
    formData.set("authorName", data.authorName);
    formData.set("handle", data.handle);
    formData.set("tweetText", data.tweetText);
    formData.set("displayText", data.displayText ?? "");
    formData.set("date", data.date);
    formData.set("isActive", data.isActive ? "true" : "false");
    if (insertPosition === "top" || insertPosition === "bottom") {
      formData.set("insertPosition", insertPosition);
    } else if (insertPosition.startsWith("after:")) {
      formData.set("insertPosition", insertPosition);
    } else {
      formData.set("insertPosition", "bottom");
    }
    if (fetchedAvatarToken) {
      formData.set("fetchedAvatarToken", fetchedAvatarToken);
    }

    if (mode === "create") {
      if (!avatarFile && !fetchedAvatarToken) {
        setSubmitError("Use “Fetch from tweet” first, or upload an avatar image.");
        return;
      }
      const tweetUrl = data.tweetUrl?.trim();
      if (tweetUrl) {
        const checkRes = await fetch(`/api/testimonials/check?tweetUrl=${encodeURIComponent(tweetUrl)}`);
        if (checkRes.ok) {
          const { duplicate } = await checkRes.json().catch(() => ({ duplicate: false }));
          if (duplicate && !window.confirm("This tweet is already in your testimonials. Add anyway?")) {
            return;
          }
        }
      }
      const res = await fetch("/api/testimonials", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSubmitError(err.error ?? "Failed to create.");
        return;
      }
      unsavedCtx?.setHasUnsavedChanges(false);
      router.push("/dashboard");
      router.refresh();
      return;
    }

    if (testimonial) {
      const res = await fetch(`/api/testimonials/${testimonial.id}`, {
        method: "PUT",
body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSubmitError(err.error ?? "Failed to update.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleFetchFromTweet = async () => {
    setFetchError(null);
    const url = form.getValues("tweetUrl")?.trim();
    if (!url) {
      setFetchError("Enter a tweet URL first.");
      return;
    }
    setFetchLoading(true);
    try {
      const res = await fetch("/api/testimonials/fetch-tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFetchError(data.error ?? "Could not fetch tweet.");
        setFetchLoading(false);
        return;
      }
      form.setValue("authorName", data.authorName ?? "");
      form.setValue("handle", data.handle ?? "");
      form.setValue("tweetText", data.tweetText ?? "", { shouldValidate: true });
      form.setValue("date", data.date ?? new Date().toISOString().slice(0, 10));
      setFetchedAvatarToken(data.avatarToken ?? null);
      setAvatarDataUrl(data.avatarDataUrl ?? null);
      setAvatarFile(null);
      unsavedCtx?.setHasUnsavedChanges(true);
    } catch {
      setFetchError("Request failed. Try again.");
    }
    setFetchLoading(false);
  };

  const previewHandle = form.watch("handle") ?? "";
  const previewDate = form.watch("date") ?? "";
  const previewTweetText = form.watch("tweetText") ?? "";
  const previewDisplayText = form.watch("displayText") ?? "";
  const previewTweet = (previewDisplayText || previewTweetText || "").trim();
  const previewAvatarUrl =
    avatarDataUrl ??
    (testimonial?.avatarFileName ? `/api/avatars/${testimonial.avatarFileName}` : null);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-5xl relative z-10 pb-16">
      {submitError && (
        <p className="text-red-600 text-sm rounded-lg bg-red-50 p-3 mb-4">{submitError}</p>
      )}
      {fetchError && (
        <p className="text-amber-700 text-sm rounded-lg bg-amber-50 p-3 mb-4">{fetchError}</p>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0 space-y-6">
      <div>
        <label htmlFor="tweetUrl" className="block text-sm font-medium text-zinc-800 mb-1">Tweet URL *</label>
        <div className="flex gap-2">
          <input
            id="tweetUrl"
            {...form.register("tweetUrl")}
            className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 bg-white"
            placeholder="https://x.com/username/status/..."
          />
          <button
            type="button"
            onClick={handleFetchFromTweet}
            disabled={fetchLoading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            {fetchLoading ? "Fetching…" : "Fetch from tweet"}
          </button>
        </div>
        <p className="text-zinc-600 text-xs mt-1">Paste the tweet URL and click to fill author, handle, text and avatar.</p>
        {form.formState.errors.tweetUrl && (
          <p className="text-red-600 text-sm mt-1">{form.formState.errors.tweetUrl.message}</p>
        )}
      </div>

      {mode === "edit" && (
        <>
          <div>
            <label htmlFor="authorName" className="block text-sm font-medium text-zinc-800 mb-1">Author name *</label>
            <input
              id="authorName"
              {...form.register("authorName")}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 bg-white"
            />
            {form.formState.errors.authorName && (
              <p className="text-red-600 text-sm mt-1">{form.formState.errors.authorName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="handle" className="block text-sm font-medium text-zinc-800 mb-1">Handle *</label>
            <input
              id="handle"
              {...form.register("handle")}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 bg-white"
              placeholder="@username"
            />
            {form.formState.errors.handle && (
              <p className="text-red-600 text-sm mt-1">{form.formState.errors.handle.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="tweetText" className="block text-sm font-medium text-zinc-800 mb-1">Tweet text *</label>
            <textarea
              id="tweetText"
              {...form.register("tweetText")}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 min-h-[100px] text-zinc-900 bg-white"
              rows={4}
            />
            {form.formState.errors.tweetText && (
              <p className="text-red-600 text-sm mt-1">{form.formState.errors.tweetText.message}</p>
            )}
          </div>
        </>
      )}

      {mode === "create" && (
        <div>
          <label htmlFor="insertPosition" className="block text-sm font-medium text-zinc-800 mb-1">
            Add tweet at
          </label>
          <select
            id="insertPosition"
            value={insertPosition}
            onChange={(e) => setInsertPosition(e.target.value)}
            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 bg-white w-full max-w-xs"
          >
            <option value="top">Top of list</option>
            <option value="bottom">Bottom of list</option>
            {existingList.map((t) => (
              <option key={t.id} value={`after:${t.id}`}>
                After: {t.handle} – {(t.tweetText || t.displayText || "").slice(0, 40)}
                {(t.tweetText || t.displayText || "").length > 40 ? "…" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...form.register("isActive")}
          id="isActive"
          className="rounded border-zinc-300"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-zinc-800">
          Active (included in export)
        </label>
      </div>

      <div className="flex gap-3 relative z-10">
        <button
          type="submit"
          className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition"
        >
          {mode === "create" ? "Create" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (mode === "create" && unsavedCtx?.hasUnsavedChanges) {
              if (!confirm("You will lose your unsaved changes. Leave anyway?")) return;
              unsavedCtx.setHasUnsavedChanges(false);
            }
            router.push("/dashboard");
          }}
          className="px-4 py-2 border border-zinc-400 rounded-lg text-zinc-800 bg-white hover:bg-zinc-100 transition"
        >
          Cancel
        </button>
      </div>
        </div>

        <div className="lg:w-80 shrink-0">
          <p className="text-sm font-medium text-zinc-800 mb-2">Preview (as on site)</p>
          <div className="lg:sticky lg:top-6">
            <TweetPreview
              handle={previewHandle}
              date={previewDate}
              tweet={previewTweet}
              profileImageUrl={previewAvatarUrl}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
