import { AuthorizeForm } from "@/app/oauth/authorize/authorize-form";
import { parseAuthorizeRequest, validateOAuthClientRequest } from "@/lib/auth/oauth-request";
import { getMcpResourceUrl } from "@/lib/auth/urls";

type AuthorizePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthorizePage({ searchParams }: AuthorizePageProps) {
  const result = await loadAuthorizePageResult(searchParams);

  if ("error" in result) {
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", fontFamily: "system-ui" }}>
        <h1>Invalid OAuth request</h1>
        <p>{result.error}</p>
      </div>
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
