import { TestimonialForm } from "@/components/TestimonialForm";

export default function NewTestimonialPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">Add testimonial</h1>
      <TestimonialForm mode="create" />
    </div>
  );
}
