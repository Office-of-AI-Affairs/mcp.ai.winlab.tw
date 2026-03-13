import { kv } from "@vercel/kv";
import { randomBytes } from "node:crypto";

interface StoredAuthData {
  accessToken: string;
  refreshToken: string;
  codeChallenge: string;
  redirectUri: string;
  clientId: string;
}

const AUTH_CODE_PREFIX = "mcp:auth:";
const AUTH_CODE_TTL_SECONDS = 300;

export async function createAuthCode(data: StoredAuthData): Promise<string> {
  const code = randomBytes(32).toString("hex");
  await kv.set(`${AUTH_CODE_PREFIX}${code}`, JSON.stringify(data), {
    ex: AUTH_CODE_TTL_SECONDS,
  });
  return code;
}

export async function exchangeAuthCode(
  code: string
): Promise<StoredAuthData | null> {
  const key = `${AUTH_CODE_PREFIX}${code}`;
  const raw = await kv.get<string>(key);
  if (!raw) return null;
  await kv.del(key);
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}
