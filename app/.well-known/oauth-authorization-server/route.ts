import { getOAuthMetadata } from "@/lib/auth/oauth-metadata";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return Response.json(getOAuthMetadata(baseUrl));
}
