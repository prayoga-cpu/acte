export function ConfidenceBadge({ confidence }: { confidence: number | null }) {
  if (confidence === null) {
    return (
      <span className="shrink-0 rounded-full border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 font-mono text-[10.5px] text-ash">
        Manuel
      </span>
    );
  }
  if (confidence >= 90) {
    return (
      <span className="shrink-0 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 font-mono text-[10.5px] text-gold-pale">
        {confidence} %
      </span>
    );
  }
  if (confidence >= 80) {
    return (
      <span className="shrink-0 rounded-full border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 font-mono text-[10.5px] text-ash">
        {confidence} %
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10.5px] text-amber-400">
      {confidence} % · à vérifier
    </span>
  );
}
