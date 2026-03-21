import { AuthorizeForm } from "@/app/oauth/authorize/authorize-form";
import { AuthShell } from "@/components/auth-shell";
import { parseAuthorizeRequest, validateOAuthClientRequest } from "@/lib/auth/oauth-request";
import { getMcpResourceUrl } from "@/lib/auth/urls";

type AuthorizePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthorizePage({ searchParams }: AuthorizePageProps) {
  const result = await loadAuthorizePageResult(searchParams);

  if ("error" in result) {
    return (
      <AuthShell
        eyebrow="AI WINLAB MCP"
        title="授權請求無效"
        description="這次 OAuth 登入請求缺少必要參數，或 client 設定和註冊資訊不一致。"
        footer={<p className="auth-note">請回到發起登入的工具重新執行授權流程。</p>}
      >
        <div className="auth-error" role="alert">
          {result.error}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthorizeForm
      clientId={result.clientId}
      redirectUri={result.redirectUri}
      codeChallenge={result.codeChallenge}
      resource={result.resource}
      state={result.state}
    />
  );
}

async function loadAuthorizePageResult(searchParams: AuthorizePageProps["searchParams"]) {
  try {
    return await loadAuthorizeRequest(searchParams);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Request validation failed",
    };
  }
}

async function loadAuthorizeRequest(searchParams: AuthorizePageProps["searchParams"]) {
  const params = new URLSearchParams();
  const resolved = await searchParams;

  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === "string") {
      params.set(key, value);
    }
  }

  const request = parseAuthorizeRequest(params);
  await validateOAuthClientRequest(request, {
    expectedResource: getMcpResourceUrl(),
  });

  return request;
}
