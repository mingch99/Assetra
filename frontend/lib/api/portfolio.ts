type ApiSuccess<T> = {
  data: T;
};

type ApiError = {
  error?: string;
};

export type PortfolioState = {
  cashAmount: number;
  debtAmount: number;
  realEstateAmount: number;
};

export type HistoryPoint = {
  date: string;
  value: number;
};

export type PortfolioHistoryResponse = {
  range: string;
  points: HistoryPoint[];
  warning?: string;
};

export type PortfolioRiskMetrics = {
  asOf: string | null;
  return7d: number | null;
  return30d: number | null;
  returnYtd: number | null;
  return1y: number | null;
  volatility7d: number | null;
  volatility30d: number | null;
  volatilityYtd: number | null;
  volatility1y: number | null;
  coveredWeight: number;
  missingSymbols: string[];
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

export function fetchPortfolioHistory(range: string) {
  return request<PortfolioHistoryResponse>(
    `/api/portfolio/history?range=${encodeURIComponent(range)}`,
    { method: "GET", cache: "no-store" }
  );
}

export function fetchPortfolioRisk() {
  return request<PortfolioRiskMetrics>("/api/portfolio/risk", {
    method: "GET",
    cache: "no-store",
  });
}
