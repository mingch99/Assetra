type ApiSuccess<T> = {
  data: T;
};

type ApiError = {
  error?: string;
};

type AuthUser = {
  id: string;
  username: string;
  email: string;
};

type AuthInput = {
  username: string;
  password: string;
  email?: string;
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

export function register(input: AuthInput) {
  return request<AuthUser>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: AuthInput) {
  return request<AuthUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function me() {
  return request<AuthUser>("/api/auth/me", {
    method: "GET",
    cache: "no-store",
  });
}

export function logout() {
  return request<{ ok: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

export type { AuthUser };
