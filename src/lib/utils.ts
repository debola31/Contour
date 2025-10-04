export function getAssetPath(path: string): string {
  const basePath = process.env.NODE_ENV === 'production' ? '/Contour' : '';
  return `${basePath}${path}`;
}
