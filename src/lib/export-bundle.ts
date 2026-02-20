import type { Testimonial } from "@/types/testimonial";
import type { TestimonialsJson, PublicTweet } from "@/types/testimonial";
import { getAvatarsDir } from "./upload";
import path from "path";
import fs from "fs";

export function buildTestimonialsJson(activeTestimonials: Testimonial[]): TestimonialsJson {
  const columns: PublicTweet[][] = [[], [], [], [], []];

  activeTestimonials.forEach((t) => {
    columns[t.columnIndex].push({
      id: t.id,
      profileImage: `/tweets/avatars/${t.avatarFileName}`,
      tweet: t.displayText || t.tweetText,
      handle: t.handle,
      date: t.date,
    });
  });

  return { columns };
}

export function getAvatarPath(avatarFileName: string): string | null {
  const avatarsDir = getAvatarsDir();
  const fullPath = path.join(avatarsDir, avatarFileName);
  return fs.existsSync(fullPath) ? fullPath : null;
}
