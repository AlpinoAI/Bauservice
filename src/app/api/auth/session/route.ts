import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";

/**
 * Re-issues the backend API key to authenticated clients.
 * Used by useApiKey() to rehydrate the key after a page refresh.
 * Route lives under /api/auth/* so middleware passes it through,
 * but we re-check the auth cookie here explicitly.
 */
export async function GET() {
  const jar = await cookies();
  if (jar.get(AUTH_COOKIE)?.value !== "ok") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ apiKey: process.env.BACKEND_API_KEY ?? "" });
}
