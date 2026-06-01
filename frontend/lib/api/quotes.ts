type ApiSuccess<T> = {
  data: T;
};

type ApiError = {
  error?: string;
};

export type Quote = {
  price: number;
  // 當日漲跌幅（%），來源無法提供時為 null。
  changePct: number | null;
};

// symbol(大寫) -> 報價
export type QuoteMap = Record<string, Quote>;

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

export function fetchQuotes() {
  return request<QuoteMap>("/api/quotes", {
    method: "GET",
    cache: "no-store",
  });
}
