export function createJobId(...parts: string[]): string {
  return parts.map((part) => encodeURIComponent(part)).join('|');
}
