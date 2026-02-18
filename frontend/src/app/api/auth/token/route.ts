import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET_KEY!);

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({
      sub: session.user.id,
      email: session.user.email,
      name: session.user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(now + 1800) // 30 minutes
      .setIssuer("taskflow-web")
      .setAudience("taskflow-api")
      .sign(jwtSecret);

    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
