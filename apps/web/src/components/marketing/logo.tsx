export function Logo({ className = "text-[22px]" }: { className?: string }) {
  return (
    <h1 className={`flex items-baseline font-display font-extrabold uppercase leading-none tracking-[0.01em] text-ivory ${className}`}>
      ACT
      <span className="relative pr-1.5">
        E
        <svg className="absolute -right-1 -top-2 h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="square">
          <path d="M4 13l5 5L20 6" />
        </svg>
      </span>
      <span className="-ml-1">.</span>
    </h1>
  );
}
