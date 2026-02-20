"use client";

function formatTweetDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function TweetPreview({
  handle,
  date,
  tweet,
  profileImageUrl,
}: {
  handle: string;
  date: string;
  tweet: string;
  profileImageUrl: string | null;
}) {
  const displayLabel = handle || "@username";
  const dateDisplay = formatTweetDate(date);
  const fallbackInitials = displayLabel.replace(/^@/, "").slice(0, 2).toUpperCase() || "??";

  return (
    <div className="tweet-preview-wrap flex flex-col relative z-10 p-4">
      <div className="gradient-layer-3" />
      <div className="gradient-layer-4" />
      <div className="gradient-layer-5" />
      <div className="tweet-preview-card">
        <div className="flex flex-row items-center gap-5">
          <div className="h-9 w-9 rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-white/70 font-medium">{fallbackInitials}</span>
            )}
          </div>
          <div className="flex flex-col justify-center gap-1 min-w-0">
            <span className="font-medium text-xs leading-4 text-white truncate">{displayLabel}</span>
            <span className="font-light text-xs leading-4 tracking-wide text-white/50">{dateDisplay || "—"}</span>
          </div>
        </div>
        <p className="font-normal text-sm leading-[21px] text-white/80 whitespace-pre-wrap break-words">
          {tweet || "Tweet text will appear here."}
        </p>
      </div>
    </div>
  );
}
