import { NextResponse } from "next/server";

import { getBackendApiUrl, TOKEN_COOKIE_NAME } from "@/lib/server-config";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid login payload" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${getBackendApiUrl()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    const data = (await upstream.json().catch(() => null)) as
      | { access_token?: string; expires_in?: number; detail?: string }
      | null;

    if (!upstream.ok) {
      return NextResponse.json(
        { detail: data?.detail ?? "Login failed" },
        { status: upstream.status }
      );
    }

    if (!data?.access_token) {
      return NextResponse.json({ detail: "Missing token from backend" }, { status: 502 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: data.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: data.expires_in ?? 8 * 60 * 60
    });

    return response;
  } catch {
    return NextResponse.json({ detail: "Unable to reach backend" }, { status: 502 });
  }
}
