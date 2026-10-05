export interface PrintIconProps {
  size?: number
}

export function PrintIcon({ size = 16 }: PrintIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5.5 7.5V3h9v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path
        d="M5.5 14.5h-1A1.5 1.5 0 0 1 3 13V9a1.5 1.5 0 0 1 1.5-1.5h11A1.5 1.5 0 0 1 17 9v4a1.5 1.5 0 0 1-1.5 1.5h-1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect
        x="5.5"
        y="11.5"
        width="9"
        height="5.5"
        rx="0.75"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}
