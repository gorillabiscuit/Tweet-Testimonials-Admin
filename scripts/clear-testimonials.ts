/**
 * Delete all testimonials from the database.
 * Run: npx tsx scripts/clear-testimonials.ts
 */

import { db } from "../src/db";
import { testimonials } from "../src/db/schema";

async function main() {
  await db.delete(testimonials);
  console.log("Cleared all testimonials.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
