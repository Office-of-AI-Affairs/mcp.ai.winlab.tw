/**
 * Web Request <-> Node.js conversion adapter
 *
 * NOTE: The MCP SDK v1.27+ ships WebStandardStreamableHTTPServerTransport which
 * natively accepts Web API Request/Response. This adapter is kept as a fallback
 * in case we ever need to use the Node.js-only StreamableHTTPServerTransport.
 */

import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { Readable } from "node:stream";

export function webRequestToNode(
  request: Request,
  body: Buffer
): IncomingMessage {
  const readable = new Readable();
  readable.push(body);
  readable.push(null);

  const nodeReq = Object.assign(readable, {
    method: request.method,
    url: new URL(request.url).pathname,
    headers: Object.fromEntries(request.headers.entries()),
    socket: new Socket(),
  }) as unknown as IncomingMessage;

  return nodeReq;
}

export function createCaptureResponse(): {
  nodeRes: ServerResponse;
  getWebResponse: () => Promise<Response>;
} {
  const chunks: Buffer[] = [];
  let statusCode = 200;
  const headers = new Headers();
  let resolvePromise: (res: Response) => void;

  const responsePromise = new Promise<Response>((resolve) => {
    resolvePromise = resolve;
  });

  const socket = new Socket();
  const nodeRes = new ServerResponse(new IncomingMessage(socket));

  nodeRes.write = ((
    chunk: unknown,
    encodingOrCallback?: unknown,
    callback?: () => void
  ): boolean => {
    if (chunk) {
      chunks.push(
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string)
      );
    }
    const cb =
      typeof encodingOrCallback === "function" ? encodingOrCallback : callback;
    if (cb) (cb as () => void)();
    return true;
  }) as typeof nodeRes.write;

  nodeRes.end = ((
    chunk?: unknown,
    encodingOrCallback?: unknown,
    callback?: () => void
  ): ServerResponse => {
    if (chunk) {
      chunks.push(
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string)
      );
    }
    statusCode = nodeRes.statusCode;
    const rawHeaders = nodeRes.getHeaders();
    for (const [key, value] of Object.entries(rawHeaders)) {
      if (value !== undefined) {
        headers.set(
          key,
          Array.isArray(value) ? value.join(", ") : String(value)
        );
      }
    }
    resolvePromise!(
      new Response(Buffer.concat(chunks), { status: statusCode, headers })
    );
    const cb =
      typeof encodingOrCallback === "function" ? encodingOrCallback : callback;
    if (cb) (cb as () => void)();
    return nodeRes;
  }) as typeof nodeRes.end;

  return { nodeRes, getWebResponse: () => responsePromise };
}
