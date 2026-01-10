// API base URL configuration
// - Production: Uses relative URLs (empty string) since FastAPI runs on same Vercel domain
// - Development: Uses localhost:8000 where FastAPI runs separately
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
