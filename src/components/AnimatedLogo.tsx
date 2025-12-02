export function AnimatedLogo() {
  return (
    <div className="relative w-12 h-12">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animated-logo"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A90F5">
              <animate
                attributeName="stop-color"
                values="#4A90F5; #5EC5E5; #C74AFF; #4A90F5"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#C74AFF">
              <animate
                attributeName="stop-color"
                values="#C74AFF; #4A90F5; #5EC5E5; #C74AFF"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>
        <path
          d="M24 8C18.5 8 14 12.5 14 18C14 23.5 24 38 24 38C24 38 34 23.5 34 18C34 12.5 29.5 8 24 8Z"
          stroke="url(#logoGradient)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="24"
          cy="18"
          r="4"
          stroke="url(#logoGradient)"
          strokeWidth="2.5"
          fill="none"
        />
      </svg>
    </div>
  );
}
