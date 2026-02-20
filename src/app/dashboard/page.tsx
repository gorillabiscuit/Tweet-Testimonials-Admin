import { TestimonialList } from "@/components/TestimonialList";
import { ExportButton } from "@/components/ExportButton";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Testimonials</h1>
        <ExportButton />
      </div>
      <TestimonialList />
    </div>
  );
}
