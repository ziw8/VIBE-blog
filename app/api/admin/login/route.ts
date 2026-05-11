import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  adminAuthIsConfigured,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  verifyAdminPassword,
} from "@/lib/admin-auth";

async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  if (!adminAuthIsConfigured()) {
    return Response.json(
      { message: "관리자 인증 설정이 필요합니다." },
      { status: 503 },
    );
  }

  const payload = await readJson(request);
  const password =
    typeof payload.password === "string" ? payload.password : "";

  if (!verifyAdminPassword(password)) {
    return Response.json(
      { message: "관리자 암호가 일치하지 않습니다." },
      { status: 403 },
    );
  }

  const token = createAdminSessionToken();

  if (!token) {
    return Response.json(
      { message: "관리자 세션을 만들지 못했습니다." },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, getAdminSessionCookieOptions());

  return Response.json({ ok: true });
}
