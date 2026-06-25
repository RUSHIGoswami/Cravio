/** Indian compact number formatting — 1.2L, 1.3Cr followers (per design-system content rules). */
export function formatIndianCompact(n: number): string {
  if (n >= 1e7) return `${trimZero(n / 1e7)}Cr`;
  if (n >= 1e5) return `${trimZero(n / 1e5)}L`;
  if (n >= 1e3) return `${trimZero(n / 1e3)}K`;
  return String(n);
}

function trimZero(n: number): string {
  return n.toFixed(1).replace(/\.0$/, '');
}
