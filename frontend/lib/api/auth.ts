type ApiSuccess<T> = {
  data: T;
};

type ApiError = {
  error?: string;
};

type AuthUser = {
  id: string;
  username: string | null;
  email: string;
};

type AuthInput = {
  email: string;
  password: string;
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

export function requestPasswordReset(email: string) {
  return request<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(input: { token: string; password: string }) {
  return request<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProfile(input: { username: string | null }) {
  return request<AuthUser>("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  return request<{ message: string }>("/api/auth/password", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteAccount(password: string) {
  return request<{ message: string }>("/api/auth/account", {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
}

export function getDisplayName(user: Pick<AuthUser, "username" | "email">) {
  return user.username && user.username.trim() ? user.username : user.email;
}

export type { AuthUser };
