import { TestimonialList } from "@/components/TestimonialList";
import { ExportButton } from "@/components/ExportButton";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 text-zinc-800">
        <h2 className="font-semibold text-zinc-900 mb-1">What this app does</h2>
        <p className="text-sm mb-2">
          Manage tweet-based testimonials for the NFTfi website. Add or edit testimonials (tweet URL, author, text, avatar), reorder them by column, and export a ZIP with <code className="bg-zinc-100 px-1 rounded">testimonials.json</code> and avatar images for developers to add to the main site.
        </p>
        <p className="text-sm text-zinc-700">
          Use <strong>Add testimonial</strong> in the header to create one, or edit/delete rows below. When ready, click <strong>Export testimonials bundle</strong> to download the ZIP.
        </p>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Testimonials</h1>
        <ExportButton />
      </div>
      <TestimonialList />
    </div>
  );
}
