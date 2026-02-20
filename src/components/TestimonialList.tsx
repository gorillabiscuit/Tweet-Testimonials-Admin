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
  const [columnFilter, setColumnFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");

  const fetchList = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (columnFilter !== "") params.set("columnIndex", columnFilter);
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
  }, [search, columnFilter, activeFilter]);

  const reorder = async (id: string, direction: "up" | "down") => {
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
    return <p className="text-zinc-500">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search handle or text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm w-56"
        />
        <select
          value={columnFilter}
          onChange={(e) => setColumnFilter(e.target.value)}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All columns</option>
          {[0, 1, 2, 3, 4].map((c) => (
            <option key={c} value={String(c)}>
              Column {c}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="text-left p-3 font-medium">Avatar</th>
              <th className="text-left p-3 font-medium">Name / Handle</th>
              <th className="text-left p-3 font-medium">Tweet</th>
              <th className="text-left p-3 font-medium">Col</th>
              <th className="text-left p-3 font-medium">Order</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Updated</th>
              <th className="text-left p-3 font-medium">Actions</th>
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
                  <div className="font-medium">{t.authorName}</div>
                  <div className="text-zinc-500">{t.handle}</div>
                </td>
                <td className="p-3 max-w-xs truncate">{t.tweetText || t.displayText}</td>
                <td className="p-3">{t.columnIndex}</td>
                <td className="p-3">{t.sortOrder}</td>
                <td className="p-3">
                  <span
                    className={
                      t.isActive
                        ? "text-green-600 font-medium"
                        : "text-zinc-400"
                    }
                  >
                    {t.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3 text-zinc-500">{new Date(t.updatedAt).toLocaleDateString()}</td>
                <td className="p-3 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => reorder(t.id, "up")}
                    className="px-2 py-1 border rounded hover:bg-zinc-100"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => reorder(t.id, "down")}
                    className="px-2 py-1 border rounded hover:bg-zinc-100"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <Link
                    href={`/dashboard/testimonials/${t.id}/edit`}
                    className="px-2 py-1 border rounded hover:bg-zinc-100"
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
          <p className="p-6 text-zinc-500 text-center">No testimonials yet. Add one to get started.</p>
        )}
      </div>
    </div>
  );
}
