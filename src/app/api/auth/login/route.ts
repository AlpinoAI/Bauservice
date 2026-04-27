import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = (await req.json()) as { password?: string };
  const expected = process.env.APP_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { error: "APP_PASSWORD not configured" },
      { status: 500 }
    );
  }
  if (!password || password !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const jar = await cookies();
  jar.set(AUTH_COOKIE, "ok", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return NextResponse.json({ ok: true, apiKey: process.env.BACKEND_API_KEY ?? "" });
}
