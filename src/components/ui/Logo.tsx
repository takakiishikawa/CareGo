import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { icon: 28, text: 28 },
  md: { icon: 32, text: 24 },
  lg: { icon: 44, text: 38 },
};

export default function Logo({ size = 'md' }: LogoProps) {
  const { icon, text } = sizes[size];

  return (
    <Link href="/dashboard" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      {/* Leaf drop icon */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M14 2C14 2 5 10.5 5 17C5 21.9706 9.02944 26 14 26C18.9706 26 23 21.9706 23 17C23 10.5 14 2 14 2Z"
          fill="var(--color-primary, #2D8A5F)"
        />
        <path
          d="M14 26V17"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M10.5 20.5C10.5 18.567 12.067 17 14 17"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span style={{
        fontSize: `${text}px`,
        fontWeight: 700,
        color: 'var(--color-primary, #2D8A5F)',
        letterSpacing: '-0.3px',
      }}>
        CareGo
      </span>
    </Link>
  );
}
