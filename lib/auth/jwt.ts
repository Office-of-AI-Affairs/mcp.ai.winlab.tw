import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface McpTokenClaims {
  sub: string;
  email?: string;
  role: "authenticated";
  aud: "authenticated";
  iss: string;
  iat: number;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "SUPABASE_JWT_SECRET is not configured — required for minting MCP tokens"
    );
  }
  return secret;
}

function base64urlEncode(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64url");
}

function base64urlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function mintMcpToken(
  userId: string,
  options: { email?: string; ttlSeconds?: number; iss?: string } = {}
): { token: string; expiresIn: number } {
  const secret = getSecret();
  const ttl = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const now = Math.floor(Date.now() / 1000);
  const claims: McpTokenClaims = {
    sub: userId,
    role: "authenticated",
    aud: "authenticated",
    iss: options.iss ?? "mcp.ai.winlab.tw",
    iat: now,
    exp: now + ttl,
    ...(options.email ? { email: options.email } : {}),
  };

  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64urlEncode(JSON.stringify(claims));
  const signature = sign(`${header}.${payload}`, secret);

  return { token: `${header}.${payload}.${signature}`, expiresIn: ttl };
}

export function verifyMcpToken(token: string): McpTokenClaims | null {
  const secret = getSecret();
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expected = sign(`${header}.${payload}`, secret);

  const provided = base64urlDecode(signature);
  const expectedBuf = base64urlDecode(expected);
  if (provided.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(provided, expectedBuf)) return null;

  let claims: McpTokenClaims;
  try {
    claims = JSON.parse(base64urlDecode(payload).toString("utf8"));
  } catch {
    return null;
  }

  if (typeof claims.exp !== "number" || claims.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  if (typeof claims.sub !== "string" || claims.sub.length === 0) return null;

  return claims;
}
