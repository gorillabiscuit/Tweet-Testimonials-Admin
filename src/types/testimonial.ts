export type Channel = "x";

export interface Testimonial {
  id: string;
  tweetId: string;
  tweetUrl: string;
  authorName: string;
  handle: string;
  avatarFileName: string;
  tweetText: string;
  displayText: string;
  date: string;
  columnIndex: number;
  sortOrder: number;
  channel: Channel;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface PublicTweet {
  id: string;
  profileImage: string;
  tweet: string;
  handle: string;
  date: string;
}

export interface TestimonialsJson {
  /** Single flat list of tweets; consumer distributes into columns (e.g. round-robin). */
  columns: PublicTweet[];
}
