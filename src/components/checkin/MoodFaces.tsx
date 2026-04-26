interface MoodFaceProps {
  score: 1 | 2 | 3 | 4 | 5;
  selected: boolean;
  size?: number;
}

export default function MoodFace({
  score,
  selected,
  size = 32,
}: MoodFaceProps) {
  const stroke = selected ? "var(--color-primary)" : "var(--color-text-subtle)";
  const sw = 1.6;

  const face = {
    1: (
      <>
        <path
          d="M 7.5,9.5 Q 9.5,8 11.5,9.5"
          stroke={stroke}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 16.5,9.5 Q 18.5,8 20.5,9.5"
          stroke={stroke}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="10" cy="12.5" r="1.4" fill={stroke} />
        <circle cx="18" cy="12.5" r="1.4" fill={stroke} />
        <path
          d="M 8,19 Q 14,14 20,19"
          stroke={stroke}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
    2: (
      <>
        <circle cx="10" cy="12" r="1.4" fill={stroke} />
        <circle cx="18" cy="12" r="1.4" fill={stroke} />
        <path
          d="M 9.5,18 Q 14,15.5 18.5,18"
          stroke={stroke}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
    3: (
      <>
        <circle cx="10" cy="12" r="1.4" fill={stroke} />
        <circle cx="18" cy="12" r="1.4" fill={stroke} />
        <line
          x1="9.5"
          y1="17"
          x2="18.5"
          y2="17"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      </>
    ),
    4: (
      <>
        <circle cx="10" cy="12" r="1.4" fill={stroke} />
        <circle cx="18" cy="12" r="1.4" fill={stroke} />
        <path
          d="M 9.5,16 Q 14,19.5 18.5,16"
          stroke={stroke}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
    5: (
      <>
        <path
          d="M 8,12 Q 10,10 12,12"
          stroke={stroke}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 16,12 Q 18,10 20,12"
          stroke={stroke}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 8,15 Q 14,20.5 20,15"
          stroke={stroke}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
  }[score];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="14"
        cy="14"
        r="12.5"
        stroke={stroke}
        strokeWidth={selected ? 1.8 : 1.2}
        fill={selected ? "var(--color-success-subtle)" : "transparent"}
      />
      {face}
    </svg>
  );
}
