interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  /** Color for the outer ring + wordmark (inherits currentColor). Defaults to brand ink. */
  ringClassName?: string;
  wordmarkClassName?: string;
}

export default function Logo({ size = 32, showWordmark = true, ringClassName = "text-brand-ink", wordmarkClassName = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${ringClassName}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          x="3" y="3" width="26" height="26" rx="8"
          transform="rotate(45 16 16)"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="10" y="10" width="12" height="12" rx="3"
          transform="rotate(45 16 16)"
          fill="currentColor"
          className="text-brand-blue"
        />
      </svg>
      {showWordmark && (
        <span className={`logo-font ${wordmarkClassName}`}>Mapper</span>
      )}
    </div>
  );
}
