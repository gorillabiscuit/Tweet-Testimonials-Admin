import { TestimonialForm } from "@/components/TestimonialForm";

export default function NewTestimonialPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 mb-2">Add testimonial</h1>
      <p className="text-zinc-700 mb-6 max-w-xl">
        Paste the tweet URL and fill in the author name, handle, and tweet text. Upload an avatar image (JPG or PNG). Column (0–4) and sort order control where it appears in the exported layout.
      </p>
      <TestimonialForm mode="create" />
    </div>
  );
}
