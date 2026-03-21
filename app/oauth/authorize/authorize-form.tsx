"use client";

import { AuthShell } from "@/components/auth-shell";
import { useState } from "react";

type AuthorizeFormProps = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  resource?: string;
  state?: string;
};

export function AuthorizeForm({
  clientId,
  redirectUri,
  codeChallenge,
  resource,
  state,
}: AuthorizeFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/oauth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          clientId,
          redirectUri,
          codeChallenge,
          resource,
          state,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error_description || data.error || "登入失敗");
        setLoading(false);
        return;
      }
      window.location.href = data.redirectUrl;
    } catch {
      setError("網路連線失敗，請稍後再試");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="AI WINLAB MCP"
      title="登入以授權工具存取"
      description="這個登入頁會將你的身份授權給 MCP client，登入成功後會自動跳回原本的工具完成連線。"
      footer={
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p className="auth-note break-all">
            Client: <span className="font-mono text-[13px] text-foreground">{clientId}</span>
          </p>
          <p className="auth-note break-all">
            Redirect URI: <span className="font-mono text-[13px] text-foreground">{redirectUri}</span>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="auth-field">
          <label className="auth-label" htmlFor="email">
            電子信箱
          </label>
          <input
            className="auth-input"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="your@email.com"
          />
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="password">
            密碼
          </label>
          <input
            className="auth-input"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="請輸入密碼"
          />
        </div>
        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? "登入中..." : "登入並授權"}
        </button>
      </form>
    </AuthShell>
  );
}
