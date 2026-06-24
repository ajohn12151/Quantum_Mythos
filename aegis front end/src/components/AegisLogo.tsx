interface AegisLogoProps {
  className?: string;
  withWordmark?: boolean;
  size?: number;
}

export function AegisLogo({ className = "", withWordmark = true, size = 28 }: AegisLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="aegis-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <path
          d="M16 2.5L27 6.5V15c0 7.5-4.8 12.6-11 14.5C9.8 27.6 5 22.5 5 15V6.5L16 2.5z"
          stroke="url(#aegis-grad)"
          strokeWidth="1.75"
          fill="url(#aegis-grad)"
          fillOpacity="0.12"
        />
        <path
          d="M11 16.5l3.2 3.2L21 13"
          stroke="url(#aegis-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {withWordmark && (
        <span className="text-[17px] font-semibold tracking-tight text-foreground">Aegis</span>
      )}
    </div>
  );
}
