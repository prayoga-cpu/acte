"use client";

export function Toast({ message }: { message: string | null }) {
  return (
    <div
      id="toast"
      className={`pointer-events-none fixed bottom-7 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-gold/30 bg-carbon/95 px-5 py-2.5 text-[13px] text-ivory shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur transition-all duration-300 ${
        message ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      {message}
    </div>
  );
}
