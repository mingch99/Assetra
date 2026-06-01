import type { AssetType } from "@/types/asset";

type ApiSuccess<T> = {
  data: T;
};

type ApiError = {
  error?: string;
};

export type SymbolSearchResult = {
  symbol: string;
  name: string;
  type: AssetType;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = (await response.json()) as ApiError;
      if (errorBody.error) message = errorBody.error;
    } catch {
      // Ignore parse errors and use fallback message.
    }
    throw new Error(message);
  }

  const json = (await response.json()) as ApiSuccess<T>;
  return json.data;
}

export function searchSymbols(query: string) {
  return request<SymbolSearchResult[]>(
    `/api/symbols/search?q=${encodeURIComponent(query)}`,
    { method: "GET", cache: "no-store" }
  );
}
