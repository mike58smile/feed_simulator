import { useState } from "react";

function SentimentPill({ sentiment }) {
  const palette = {
    positive: "bg-emerald-500/20 text-emerald-200",
    negative: "bg-rose-500/20 text-rose-200",
    neutral: "bg-slate-500/20 text-slate-200"
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${palette[sentiment] ?? palette.neutral}`}>
      {sentiment.toUpperCase()}
    </span>
  );
}

export default function FeedCard({ post, onInteract }) {
  const [locked, setLocked] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleLike = () => {
    if (locked) {
      return;
    }
    setPulse(true);
    setLocked(true);
    setIsRemoving(true);
    
    // Delay the callback to allow animation
    setTimeout(() => {
      onInteract();
    }, 300);
  };

  return (
    <div className={`glass-panel dopamine-flash relative overflow-hidden rounded-3xl border border-white/6 shadow-card transition-all duration-300 hover:-translate-y-1 ${
      isRemoving ? "animate-slideOut opacity-0" : ""
    }`}>
      <div className="relative h-48 w-full overflow-hidden sm:h-56">
        <img
          src={post.image}
          alt={post.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-base/80 via-brand-base/20 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow">
            {post.topic}
          </span>
          <SentimentPill sentiment={post.sentiment} />
        </div>
      </div>

      <div className="space-y-4 px-5 pb-5 pt-4 sm:space-y-6 sm:px-6 sm:pb-6 sm:pt-5">
        <header className="space-y-2">
          <h3 className="text-lg font-semibold leading-tight text-slate-50 sm:text-xl">{post.title}</h3>
          <p className="text-sm leading-relaxed text-slate-300/90">{post.text}</p>
        </header>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Polarizačný náboj
          </span>
          <div className="flex h-2 w-32 overflow-hidden rounded-full bg-slate-700">
            <div
              className="bg-gradient-to-r from-brand-accent via-violet-500 to-rose-500"
              style={{ width: `${Math.round(post.intensity * 100)}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleLike}
          className={`group flex w-full items-center justify-center rounded-2xl border border-white/5 bg-rose-500/15 px-4 py-4 text-center text-3xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-base hover:bg-rose-500/25 active:scale-95 ${
            pulse ? "animate-pulsePop" : ""
          } ${locked ? "cursor-default opacity-50" : ""}`}
          disabled={locked}
          aria-label="Páči sa mi"
        >
          ❤️
        </button>
      </div>
    </div>
  );
}
