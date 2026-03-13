import { createClient } from "@supabase/supabase-js";
import { exchangeAuthCode } from "@/lib/auth/auth-codes";
import { verifyPkce } from "@/lib/auth/pkce";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  const body = await request.formData();
  const grantType = body.get("grant_type") as string;

  if (grantType === "authorization_code") {
    return handleAuthorizationCode(body);
  } else if (grantType === "refresh_token") {
    return handleRefreshToken(body);
  }

  return Response.json({ error: "unsupported_grant_type" }, { status: 400 });
}

async function handleAuthorizationCode(body: FormData) {
  const code = body.get("code") as string;
  const codeVerifier = body.get("code_verifier") as string;

  if (!code || !codeVerifier) {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "Missing code or code_verifier",
      },
      { status: 400 }
    );
  }

  const redirectUri = body.get("redirect_uri") as string;
  const clientId = body.get("client_id") as string;

  const stored = await exchangeAuthCode(code);
  if (!stored) {
    return Response.json(
      {
        error: "invalid_grant",
        error_description: "Invalid or expired authorization code",
      },
      { status: 400 }
    );
  }

  if (redirectUri && redirectUri !== stored.redirectUri) {
    return Response.json(
      {
        error: "invalid_grant",
        error_description: "redirect_uri mismatch",
      },
      { status: 400 }
    );
  }

  if (clientId && clientId !== stored.clientId) {
    return Response.json(
      {
        error: "invalid_grant",
        error_description: "client_id mismatch",
      },
      { status: 400 }
    );
  }

  if (!verifyPkce(codeVerifier, stored.codeChallenge)) {
    return Response.json(
      {
        error: "invalid_grant",
        error_description: "PKCE verification failed",
      },
      { status: 400 }
    );
  }

  return Response.json({
    access_token: stored.accessToken,
    refresh_token: stored.refreshToken,
    token_type: "Bearer",
    expires_in: 3600,
  });
}

async function handleRefreshToken(body: FormData) {
  const refreshToken = body.get("refresh_token") as string;

  if (!refreshToken) {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "Missing refresh_token",
      },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    return Response.json(
      {
        error: "invalid_grant",
        error_description: error?.message || "Refresh failed",
      },
      { status: 400 }
    );
  }

  return Response.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    token_type: "Bearer",
    expires_in: 3600,
  });
}
