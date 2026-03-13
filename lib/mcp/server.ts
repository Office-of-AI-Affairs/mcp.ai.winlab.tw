import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createMcpServer(supabase: SupabaseClient, userId: string) {
  const server = new McpServer({
    name: "nycu-ai-office",
    version: "0.1.0",
  });

  // Test tool — will be replaced with real tools in later tasks
  server.tool("ping", {}, async () => {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: true, data: { userId } }),
        },
      ],
    };
  });

  return server;
}
