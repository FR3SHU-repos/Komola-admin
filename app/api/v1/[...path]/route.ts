import { NextRequest, NextResponse } from "next/server";

type Context = { params: Promise<{ path: string[] }> };

function baseURL() {
  return (process.env.GO_API_BASE_URL ?? process.env.NEXT_PUBLIC_GO_API_URL ?? "").replace(/\/+$/, "");
}

function relayHeaders(request: NextRequest) {
  const headers: Record<string, string> = { Accept: "application/json" };
  for (const name of ["cookie", "authorization", "idempotency-key", "if-match", "x-organization-id", "x-location-id"]) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  if (request.method !== "GET") headers["Content-Type"] = request.headers.get("content-type") ?? "application/json";
  return headers;
}

async function relay(request: NextRequest, context: Context) {
  const base = baseURL();
  if (!base) return NextResponse.json({ success: false, message: "GO_API_BASE_URL is not configured", code: "api_base_unset" }, { status: 503 });
  const { path } = await context.params;
  const target = new URL(`${base}/api/v1/${path.map(encodeURIComponent).join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: relayHeaders(request),
      body: request.method === "GET" ? undefined : await request.text(),
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
    const body = await upstream.text();
    const contentType = upstream.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) return new NextResponse(body, { status: upstream.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
    return NextResponse.json({ success: false, message: upstream.status === 404 ? "Admin API endpoint not found" : `Backend returned ${upstream.status}`, code: "upstream_non_json" }, { status: upstream.status >= 400 ? upstream.status : 502 });
  } catch {
    return NextResponse.json({ success: false, message: "API service is unavailable", code: "upstream_unreachable" }, { status: 503 });
  }
}

export async function GET(request: NextRequest, context: Context) { return relay(request, context); }
export async function POST(request: NextRequest, context: Context) { return relay(request, context); }
export async function PATCH(request: NextRequest, context: Context) { return relay(request, context); }
export async function PUT(request: NextRequest, context: Context) { return relay(request, context); }
export async function DELETE(request: NextRequest, context: Context) { return relay(request, context); }
