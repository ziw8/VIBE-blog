import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "blog_admin_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 6;

type AdminSessionPayload = {
  exp: number;
  iat: number;
  nonce: string;
};

function getAdminPasswordHash() {
  return process.env.ADMIN_PASSWORD_HASH;
}

function getAdminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  const secret = getAdminSessionSecret();

  if (!secret) {
    return null;
  }

  return createHmac("sha256", secret).update(value).digest("base64url");
}

function secureCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function adminAuthIsConfigured() {
  return Boolean(getAdminPasswordHash() && getAdminSessionSecret());
}

export function verifyAdminPassword(password: string) {
  const storedHash = getAdminPasswordHash();
  const [scheme, salt, hash] = storedHash?.split(":") ?? [];

  if (scheme !== "scrypt" || !salt || !hash) {
    return false;
  }

  const candidate = scryptSync(password, salt, 64).toString("hex");

  return secureCompare(candidate, hash);
}

export function createAdminSessionToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
    nonce: randomBytes(16).toString("hex"),
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  if (!signature) {
    return null;
  }

  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token?: string) {
  if (!token) {
    return false;
  }

  const [encodedPayload, signature] = token.split(".");
  const expectedSignature = encodedPayload ? sign(encodedPayload) : null;

  if (!encodedPayload || !signature || !expectedSignature) {
    return false;
  }

  if (!secureCompare(signature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<
      AdminSessionPayload
    >;

    return typeof payload.exp === "number" && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export async function adminIsAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  return verifyAdminSessionToken(token);
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
