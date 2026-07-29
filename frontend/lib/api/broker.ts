import type { BrokerConnectionSummary } from "@/types/asset";

type ApiError = { error?: string };

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiError;
    if (body.error) return body.error;
  } catch {
    // fall through
  }
  return `Request failed with status ${response.status}`;
}

export async function createBrokerLinkToken(): Promise<string> {
  const response = await fetch("/api/broker/link/token", { method: "POST" });
  if (!response.ok) throw new Error(await readError(response));
  const body = (await response.json()) as { data?: { linkToken?: string } };
  if (!body.data?.linkToken) throw new Error("Missing link token.");
  return body.data.linkToken;
}

export async function exchangeBrokerPublicToken(publicToken: string): Promise<{
  connectionId: string;
  institutionName: string | null;
  importedCount: number;
  skippedCount: number;
}> {
  const response = await fetch("/api/broker/link/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicToken }),
  });
  if (!response.ok) throw new Error(await readError(response));
  const body = (await response.json()) as {
    data?: {
      connectionId: string;
      institutionName: string | null;
      importedCount: number;
      skippedCount: number;
    };
  };
  if (!body.data) throw new Error("Missing exchange response.");
  return body.data;
}

export async function fetchBrokerConnections(): Promise<
  BrokerConnectionSummary[]
> {
  const response = await fetch("/api/broker/connections");
  if (!response.ok) throw new Error(await readError(response));
  const body = (await response.json()) as { data?: BrokerConnectionSummary[] };
  return body.data ?? [];
}

export async function syncBrokerConnections(connectionId?: string): Promise<{
  importedCount?: number;
  results?: Array<{ importedCount: number }>;
}> {
  const response = await fetch("/api/broker/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(connectionId ? { connectionId } : {}),
  });
  if (!response.ok) throw new Error(await readError(response));
  const body = (await response.json()) as {
    data?: {
      importedCount?: number;
      results?: Array<{ importedCount: number }>;
    };
  };
  return body.data ?? {};
}

export async function disconnectBrokerConnection(
  connectionId: string
): Promise<void> {
  const response = await fetch(`/api/broker/connections/${connectionId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(await readError(response));
}
