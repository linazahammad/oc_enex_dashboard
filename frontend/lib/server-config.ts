export const TOKEN_COOKIE_NAME = "oc_hr_admin_token";

export function getBackendApiUrl(): string {
  const raw = process.env.BACKEND_API_URL?.trim();
  if (!raw) {
    throw new Error("BACKEND_API_URL is not set");
  }
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}
