"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { testimonialSchema, type TestimonialFormValues } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
};

const defaultValues: TestimonialFormValues = {
  tweetUrl: "",
  authorName: "",
  handle: "",
  tweetText: "",
  displayText: "",
  date: "",
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    formData.set("columnIndex", String(data.columnIndex));
    formData.set("sortOrder", String(data.sortOrder));
    formData.set("isActive", data.isActive ? "true" : "false");
    if (avatarFile) {
      formData.set("avatar", avatarFile);
    }

    if (mode === "create") {
      if (!avatarFile) {
        setSubmitError("Avatar image is required.");
        return;
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
      router.push("/dashboard");
      router.refresh();
      return;
    }

    if (testimonial) {
      const res = await fetch(`/api/testimonials/${testimonial.id}`, {
        method: "PUT",
        body: avatarFile ? formData : JSON.stringify(data),
        headers: avatarFile ? {} : { "Content-Type": "application/json" },
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      {submitError && (
        <p className="text-red-600 text-sm rounded-lg bg-red-50 p-3">{submitError}</p>
      )}

      <div>
        <label htmlFor="tweetUrl" className="block text-sm font-medium text-zinc-800 mb-1">Tweet URL *</label>
        <input
          id="tweetUrl"
          {...form.register("tweetUrl")}
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 bg-white"
          placeholder="https://x.com/..."
        />
        {form.formState.errors.tweetUrl && (
          <p className="text-red-600 text-sm mt-1">{form.formState.errors.tweetUrl.message}</p>
        )}
      </div>

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

      <div>
        <label htmlFor="displayText" className="block text-sm font-medium text-zinc-800 mb-1">Display text (optional)</label>
        <textarea
          id="displayText"
          {...form.register("displayText")}
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 min-h-[80px] text-zinc-900 bg-white"
          placeholder="Override for site; leave empty to use tweet text"
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-zinc-800 mb-1">Date *</label>
        <input
          id="date"
          type="date"
          {...form.register("date")}
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 bg-white"
        />
        {form.formState.errors.date && (
          <p className="text-red-600 text-sm mt-1">{form.formState.errors.date.message}</p>
        )}
      </div>

      <div className="flex gap-6">
        <div>
          <label htmlFor="columnIndex" className="block text-sm font-medium text-zinc-800 mb-1">Column (0–4) *</label>
          <select
            id="columnIndex"
            {...form.register("columnIndex", { valueAsNumber: true })}
            className="border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 bg-white"
          >
            {[0, 1, 2, 3, 4].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {form.formState.errors.columnIndex && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.columnIndex.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="sortOrder" className="block text-sm font-medium text-zinc-800 mb-1">Sort order *</label>
          <input
            id="sortOrder"
            type="number"
            min={0}
            {...form.register("sortOrder", { valueAsNumber: true })}
            className="w-24 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 bg-white"
          />
          {form.formState.errors.sortOrder && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.sortOrder.message}</p>
          )}
        </div>
      </div>

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

      <div>
        <label htmlFor="avatar" className="block text-sm font-medium text-zinc-800 mb-1">
          Avatar image {mode === "create" ? "*" : "(optional, replace)"}
        </label>
        <input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-zinc-700 file:mr-3 file:py-2 file:px-3 file:rounded file:border file:border-zinc-300 file:bg-white file:text-zinc-900"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition"
        >
          {mode === "create" ? "Create" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
