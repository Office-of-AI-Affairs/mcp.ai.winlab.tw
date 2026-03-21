export default function Home() {
  return (
    <main className="auth-shell relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_60%),linear-gradient(90deg,rgba(255,255,255,0.82),rgba(255,255,255,0.1))]" />
      <div className="pointer-events-none absolute -right-20 bottom-8 h-56 w-56 rounded-full bg-[color-mix(in_srgb,var(--primary)_16%,white)] blur-3xl" />
      <section className="relative z-10 w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white/88 p-8 shadow-[0_24px_80px_rgba(0,51,160,0.12)] backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">AI WINLAB MCP</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">mcp.ai.winlab.tw</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          這裡提供 AI WinLab 的 MCP tool endpoint 與 OAuth 授權流程。MCP client 請使用
          <code className="mx-1 rounded bg-muted px-2 py-1 font-mono text-[13px] text-foreground">/mcp</code>
          進行連線。
        </p>
      </section>
    </main>
  );
}
