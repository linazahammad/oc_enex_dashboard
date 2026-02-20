import { NextRequest, NextResponse } from "next/server";

import { getBackendApiUrl, TOKEN_COOKIE_NAME } from "@/lib/server-config";

type RouteContext = {
  params: {
    path: string[];
  };
};

async function handler(request: NextRequest, context: RouteContext) {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const targetPath = context.params.path.join("/");
  const targetUrl = `${getBackendApiUrl()}/api/${targetPath}${request.nextUrl.search}`;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const requestInit: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store"
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    requestInit.body = await request.text();
  }

  const upstream = await fetch(targetUrl, requestInit);
  const payload = await upstream.arrayBuffer();

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  const upstreamDisposition = upstream.headers.get("content-disposition");

  if (upstreamType) {
    responseHeaders.set("content-type", upstreamType);
  }
  if (upstreamDisposition) {
    responseHeaders.set("content-disposition", upstreamDisposition);
  }

  return new NextResponse(payload, {
    status: upstream.status,
    headers: responseHeaders
  });
}

export const dynamic = "force-dynamic";

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
