export default function Home() {
  return (
    <main className="auth-shell">
      <section className="auth-panel max-w-2xl">
        <p className="auth-kicker">AI WINLAB MCP</p>
        <h1 className="auth-title">mcp.ai.winlab.tw</h1>
        <p className="auth-description">
          這裡提供 AI WinLab 的 MCP tool endpoint 與 OAuth 授權流程。MCP client 請使用
          <code className="mx-1 rounded bg-muted px-2 py-1 font-mono text-[13px] text-foreground">/mcp</code>
          進行連線。
        </p>
      </section>
    </main>
  );
}
