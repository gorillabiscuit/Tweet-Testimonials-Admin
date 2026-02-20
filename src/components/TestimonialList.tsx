"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Testimonial = {
  id: string;
  tweetUrl: string;
  authorName: string;
  handle: string;
  avatarFileName: string;
  tweetText: string;
  displayText: string;
  date: string;
  columnIndex: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export function TestimonialList() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("");

  const fetchList = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeFilter !== "") params.set("isActive", activeFilter);
    const res = await fetch(`/api/testimonials?${params}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchList();
  }, [search, activeFilter]);

  const reorder = async (id: string, direction: "up" | "down" | "top" | "bottom") => {
    const res = await fetch("/api/testimonials/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, direction }),
    });
    if (res.ok) fetchList();
  };

  const deleteOne = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    const res = await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
    if (res.ok) fetchList();
  };

  if (loading) {
    return <p className="text-zinc-700">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          id="search"
          name="search"
          type="text"
          placeholder="Search handle or text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm w-56 text-zinc-900 bg-white"
        />
        <select
          id="activeFilter"
          name="activeFilter"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 bg-white"
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-100">
              <th className="text-left p-3 font-medium text-zinc-900">Avatar</th>
              <th className="text-left p-3 font-medium text-zinc-900">Name / Handle</th>
              <th className="text-left p-3 font-medium text-zinc-900">Tweet</th>
              <th className="text-left p-3 font-medium text-zinc-900">Status</th>
              <th className="text-left p-3 font-medium text-zinc-900">Updated</th>
              <th className="text-left p-3 font-medium text-zinc-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="p-3">
                  <img
                    src={`/api/avatars/${t.avatarFileName}`}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </td>
                <td className="p-3">
                  <div className="font-medium text-zinc-900">{t.authorName}</div>
                  <div className="text-zinc-700">{t.handle}</div>
                </td>
                <td className="p-3 max-w-xs truncate text-zinc-800">{t.tweetText || t.displayText}</td>
                <td className="p-3">
                  <span
                    className={
                      t.isActive
                        ? "text-green-700 font-medium"
                        : "text-zinc-600"
                    }
                  >
                    {t.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3 text-zinc-700">{new Date(t.updatedAt).toLocaleDateString()}</td>
                <td className="p-3 flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => reorder(t.id, "top")}
                    className="px-2 py-1 border border-zinc-400 rounded text-zinc-800 bg-white hover:bg-zinc-100"
                    title="Send to top"
                  >
                    Top
                  </button>
                  <button
                    type="button"
                    onClick={() => reorder(t.id, "up")}
                    className="px-2 py-1 border border-zinc-400 rounded text-zinc-800 bg-white hover:bg-zinc-100"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => reorder(t.id, "down")}
                    className="px-2 py-1 border border-zinc-400 rounded text-zinc-800 bg-white hover:bg-zinc-100"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => reorder(t.id, "bottom")}
                    className="px-2 py-1 border border-zinc-400 rounded text-zinc-800 bg-white hover:bg-zinc-100"
                    title="Send to bottom"
                  >
                    Bottom
                  </button>
                  <Link
                    href={`/dashboard/testimonials/${t.id}/edit`}
                    className="px-2 py-1 border border-zinc-400 rounded text-zinc-800 bg-white hover:bg-zinc-100 inline-block"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteOne(t.id)}
                    className="px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="p-6 text-zinc-700 text-center">No testimonials yet. Click <strong>Add testimonial</strong> in the header to create one.</p>
        )}
      </div>
    </div>
  );
}
