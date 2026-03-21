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
      panelClassName="max-w-2xl"
      footer={
        <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <p className="rounded-xl border border-border bg-muted/70 px-4 py-3 break-all">
            Client: <span className="font-mono text-[13px] text-foreground">{clientId}</span>
          </p>
          <p className="rounded-xl border border-border bg-muted/70 px-4 py-3 break-all">
            Redirect URI: <span className="font-mono text-[13px] text-foreground">{redirectUri}</span>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            電子信箱
          </label>
          <input
            className="h-12 rounded-md border border-border bg-white px-4 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/80 focus:border-primary focus:ring-4 focus:ring-[rgba(0,51,160,0.14)]"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="your@email.com"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            密碼
          </label>
          <input
            className="h-12 rounded-md border border-border bg-white px-4 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/80 focus:border-primary focus:ring-4 focus:ring-[rgba(0,51,160,0.14)]"
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
          <p
            className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive md:col-span-2"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 disabled:active:scale-100 md:col-span-2"
          disabled={loading}
        >
          {loading ? "登入中..." : "登入並授權"}
        </button>
      </form>
    </AuthShell>
  );
}
