"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function AuthorizeForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clientId = searchParams.get("client_id") || "";
  const redirectUri = searchParams.get("redirect_uri") || "";
  const codeChallenge = searchParams.get("code_challenge") || "";
  const codeChallengeMethod = searchParams.get("code_challenge_method") || "";
  const state = searchParams.get("state") || "";

  if (!redirectUri || !codeChallenge || codeChallengeMethod !== "S256") {
    return <p>Invalid OAuth request. Missing required parameters.</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/oauth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, clientId, redirectUri, codeChallenge, state }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      window.location.href = data.redirectUrl;
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", fontFamily: "system-ui" }}>
      <h1>NYCU AI Office</h1>
      <p>Sign in to authorize MCP access</p>
      {clientId && <p style={{ color: "#666", fontSize: 14 }}>Client: {clientId}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: "8px 24px" }}>
          {loading ? "Signing in..." : "Authorize"}
        </button>
      </form>
    </div>
  );
}

export default function AuthorizePage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <AuthorizeForm />
    </Suspense>
  );
}
