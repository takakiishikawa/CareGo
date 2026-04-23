interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { icon: 20 },
  md: { icon: 24 },
  lg: { icon: 32 },
};

export default function Logo({ size = "md" }: LogoProps) {
  const { icon } = sizes[size];

  return (
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
  );
}
