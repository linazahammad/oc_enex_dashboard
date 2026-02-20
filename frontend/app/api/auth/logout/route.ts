import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getBackendApiUrl, TOKEN_COOKIE_NAME } from "@/lib/server-config";

export async function POST() {
  const token = cookies().get(TOKEN_COOKIE_NAME)?.value;

  if (token) {
    await fetch(`${getBackendApiUrl()}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    }).catch(() => null);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: TOKEN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return response;
}
