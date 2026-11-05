/**
 * The sage leaf with a blush bud: the two halves of the shop's own name.
 *
 * Drawn here rather than lifted, because pinksage.co.uk carries the
 * floristPro platform's stock mark rather than one of their own. If they
 * have a real logo, it replaces this file and nothing else changes.
 */
export default function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden>
      <path
        d="M13 24C13 24 4 20.5 4 13.2 4 7.6 8.2 3 13 3s9 4.6 9 10.2C22 20.5 13 24 13 24Z"
        fill="var(--color-sage-wash)"
        stroke="var(--color-sage-mid)"
        strokeWidth="1.3"
      />
      <path d="M13 21V8" stroke="var(--color-sage-mid)" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="13" cy="8" r="3.1" fill="var(--color-blush)" />
    </svg>
  );
}
