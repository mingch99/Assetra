import type { AssetGroup, NewAssetGroup } from "@/types/asset";

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

  const json = (await response.json()) as ApiSuccess<T>;
  return json.data;
}

export function fetchGroups() {
  return request<AssetGroup[]>("/api/groups", {
    method: "GET",
    cache: "no-store",
  });
}

export function createGroup(input: NewAssetGroup) {
  return request<AssetGroup>("/api/groups", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateGroupName(id: string, name: string) {
  return request<AssetGroup>(`/api/groups/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export function deleteGroup(id: string) {
  return request<{ ok: boolean }>(`/api/groups/${id}`, {
    method: "DELETE",
  });
}
