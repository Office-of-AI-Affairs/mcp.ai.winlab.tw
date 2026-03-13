import { randomUUID } from "node:crypto";

export async function POST(request: Request) {
  const body = await request.json();

  const clientId = randomUUID();

  return Response.json(
    {
      client_id: clientId,
      client_name: body.client_name || "MCP Client",
      redirect_uris: body.redirect_uris || [],
      grant_types: body.grant_types || ["authorization_code", "refresh_token"],
      response_types: body.response_types || ["code"],
      token_endpoint_auth_method: "none",
    },
    { status: 201 }
  );
}
