import { TestimonialForm } from "@/components/TestimonialForm";

export default function NewTestimonialPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 mb-2">Add testimonial</h1>
      <p className="text-zinc-700 mb-6 max-w-xl">
        Paste the tweet URL and click <strong>Fetch from tweet</strong> — the app will fill in author, handle, tweet text, and avatar. Adjust column and sort order if needed, then click Create.
      </p>
      <TestimonialForm mode="create" />
    </div>
  );
}
