type ApiSuccess<T> = {
  data: T;
};

type ApiError = {
  error?: string;
};

export type PortfolioState = {
  cashAmount: number;
  debtAmount: number;
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

export function fetchPortfolioState() {
  return request<PortfolioState>("/api/portfolio", {
    method: "GET",
    cache: "no-store",
  });
}

export function savePortfolioState(input: PortfolioState) {
  return request<PortfolioState>("/api/portfolio", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
