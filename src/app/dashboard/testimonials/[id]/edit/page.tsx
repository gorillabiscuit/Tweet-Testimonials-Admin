import { notFound } from "next/navigation";
import { TestimonialForm } from "@/components/TestimonialForm";
import { getTestimonial } from "@/lib/api";

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const testimonial = await getTestimonial(id);
  if (!testimonial) notFound();
  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">Edit testimonial</h1>
      <TestimonialForm testimonial={testimonial} mode="edit" />
    </div>
  );
}
