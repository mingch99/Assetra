import type { Asset, NewAsset } from "@/types/asset";

type ApiSuccess<T> = {
  data: T;
};

type ApiError = {
  error?: string;
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

  if (response.status === 204) {
    return undefined as T;
  }

  const json = (await response.json()) as ApiSuccess<T>;
  return json.data;
}

export async function fetchAssets() {
  return request<Asset[]>("/api/assets", { method: "GET", cache: "no-store" });
}

export async function createAsset(input: NewAsset) {
  return request<Asset>("/api/assets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAsset(id: string, input: NewAsset) {
  return request<Asset>(`/api/assets/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteAsset(id: string) {
  return request<void>(`/api/assets/${id}`, {
    method: "DELETE",
  });
}
