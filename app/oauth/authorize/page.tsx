import { AuthorizeForm } from "@/app/oauth/authorize/authorize-form";
import { parseAuthorizeRequest, validateOAuthClientRequest } from "@/lib/auth/oauth-request";
import { getMcpResourceUrl } from "@/lib/auth/urls";

type AuthorizePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthorizePage({ searchParams }: AuthorizePageProps) {
  try {
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

    return (
      <AuthorizeForm
        clientId={request.clientId}
        redirectUri={request.redirectUri}
        codeChallenge={request.codeChallenge}
        resource={request.resource}
        state={request.state}
      />
    );
  } catch (error) {
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", fontFamily: "system-ui" }}>
        <h1>Invalid OAuth request</h1>
        <p>{error instanceof Error ? error.message : "Request validation failed"}</p>
      </div>
    );
  }
}
