import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const testimonials = sqliteTable(
  "testimonials",
  {
    id: text("id").primaryKey(),
    tweetId: text("tweet_id").default(""),
    tweetUrl: text("tweet_url").notNull(),
    authorName: text("author_name").notNull(),
    handle: text("handle").notNull(),
    avatarFileName: text("avatar_file_name").notNull(),
    tweetText: text("tweet_text").notNull(),
    displayText: text("display_text").default(""),
    date: text("date").notNull(),
    columnIndex: integer("column_index").notNull(),
    sortOrder: integer("sort_order").notNull(),
    channel: text("channel").notNull().default("x"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  }
);

export type TestimonialRow = typeof testimonials.$inferSelect;
export type TestimonialInsert = typeof testimonials.$inferInsert;
