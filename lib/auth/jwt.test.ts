import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { mintMcpToken, verifyMcpToken } from "@/lib/auth/jwt";

const ORIGINAL_SECRET = process.env.SUPABASE_JWT_SECRET;

beforeEach(() => {
  process.env.SUPABASE_JWT_SECRET = "unit-test-secret-please-do-not-use-in-prod";
});

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.SUPABASE_JWT_SECRET;
  } else {
    process.env.SUPABASE_JWT_SECRET = ORIGINAL_SECRET;
  }
});

describe("mintMcpToken / verifyMcpToken", () => {
  test("round-trips a freshly minted token", () => {
    const { token, expiresIn } = mintMcpToken("user-123", { email: "loki@winlab.tw" });
    const claims = verifyMcpToken(token);

    assert.equal(expiresIn, 60 * 60 * 24 * 30);
    assert.ok(claims, "verify should accept its own minted token");
    assert.equal(claims.sub, "user-123");
    assert.equal(claims.email, "loki@winlab.tw");
    assert.equal(claims.role, "authenticated");
    assert.equal(claims.aud, "authenticated");
  });

  test("rejects an expired token", () => {
    const { token } = mintMcpToken("user-123", { ttlSeconds: -10 });
    assert.equal(verifyMcpToken(token), null);
  });

  test("rejects a token tampered with after signing", () => {
    const { token } = mintMcpToken("user-123");
    const [header, payload, sig] = token.split(".");

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    decoded.sub = "attacker";
    const tampered = Buffer.from(JSON.stringify(decoded), "utf8").toString("base64url");

    assert.equal(verifyMcpToken(`${header}.${tampered}.${sig}`), null);
  });

  test("rejects a token signed with a different secret", () => {
    const { token } = mintMcpToken("user-123");
    process.env.SUPABASE_JWT_SECRET = "a-different-secret-entirely";
    assert.equal(verifyMcpToken(token), null);
  });

  test("rejects malformed tokens", () => {
    assert.equal(verifyMcpToken("not-a-jwt"), null);
    assert.equal(verifyMcpToken("only.two"), null);
    assert.equal(verifyMcpToken(""), null);
  });
});
