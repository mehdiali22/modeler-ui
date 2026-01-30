export function joinUrl(base: string, path: string): string
{
  const b = (base ?? '').replace(/\/+$/, '');
  const p = (path ?? '').replace(/^\/+/, '');
  if (!b) return '/' + p;
  return `${b}/${p}`;
}
