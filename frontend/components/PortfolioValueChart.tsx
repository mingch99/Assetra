"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchPortfolioHistory,
  type HistoryPoint,
} from "@/lib/api/portfolio";
import type { HistoryRange } from "@/types/asset";

const RANGES: Array<{ key: HistoryRange; label: string }> = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "1y", label: "1Y" },
  { key: "ytd", label: "YTD" },
];

type PortfolioValueChartProps = {
  refreshKey?: number;
};

export default function PortfolioValueChart({
  refreshKey = 0,
}: PortfolioValueChartProps) {
  const [range, setRange] = useState<HistoryRange>("ytd");
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [warning, setWarning] = useState<string | undefined>();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const hasLoadedOnceRef = useRef(false);
  const lastRangeRef = useRef(range);

  useEffect(() => {
    let cancelled = false;
    const rangeChanged = lastRangeRef.current !== range;
    lastRangeRef.current = range;

    async function load() {
      // Only blank the chart on first load or when the user switches range.
      // Background refreshes keep the previous chart to avoid layout jump.
      if (!hasLoadedOnceRef.current || rangeChanged) {
        setIsInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError("");

      try {
        const data = await fetchPortfolioHistory(range);
        if (cancelled) return;
        setPoints(data.points);
        setWarning(data.warning);
        hasLoadedOnceRef.current = true;
      } catch (err) {
        if (cancelled) return;
        if (!hasLoadedOnceRef.current || rangeChanged) {
          setPoints([]);
        }
        setError(
          err instanceof Error ? err.message : "Failed to load portfolio history."
        );
      } finally {
        if (!cancelled) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [range, refreshKey]);

  const chart = useMemo(() => {
    if (points.length === 0) return null;

    const width = 720;
    const height = 220;
    const padX = 16;
    const padY = 20;
    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;

    const coords = points.map((point, index) => {
      const x =
        padX +
        (points.length === 1
          ? (width - padX * 2) / 2
          : (index / (points.length - 1)) * (width - padX * 2));
      const y =
        height - padY - ((point.value - min) / span) * (height - padY * 2);
      return { x, y, ...point };
    });

    const line = coords
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
    const area = `${line} L ${coords[coords.length - 1].x} ${height - padY} L ${
      coords[0].x
    } ${height - padY} Z`;

    const latest = points[points.length - 1]?.value ?? 0;
    const first = points[0]?.value ?? 0;
    const change = latest - first;
    const changePct = first === 0 ? 0 : (change / first) * 100;

    return { width, height, line, area, latest, change, changePct };
  }, [points]);

  return (
    <section className="mb-8 min-h-[24rem] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--accent)]">
            Portfolio Value
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Reconstructed from current holdings; past trades are not reflected.
            {isRefreshing ? " Updating…" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setRange(item.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                range === item.key
                  ? "bg-[var(--accent)] text-black"
                  : "border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--surface)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isInitialLoading && (
        <p className="text-sm text-[var(--muted)]">Loading chart…</p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!isInitialLoading && !error && chart && (
        <>
          <div className="mb-3 flex flex-wrap items-end gap-4">
            <p className="text-3xl font-bold text-[var(--accent)]">
              $
              {chart.latest.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </p>
            <p
              className={`text-sm font-semibold ${
                chart.change >= 0 ? "text-green-500" : "text-red-400"
              }`}
            >
              {chart.change >= 0 ? "+" : "-"}$
              {Math.abs(chart.change).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}{" "}
              ({chart.change >= 0 ? "+" : "-"}
              {Math.abs(chart.changePct).toFixed(2)}%)
            </p>
          </div>
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="h-56 w-full"
            role="img"
            aria-label="Portfolio value chart"
          >
            <path d={chart.area} fill="rgba(212, 175, 55, 0.15)" />
            <path
              d={chart.line}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
          {warning && (
            <p className="mt-2 text-xs text-[var(--muted)]">{warning}</p>
          )}
        </>
      )}

      {!isInitialLoading && !error && !chart && (
        <p className="text-sm text-[var(--muted)]">
          No chart data available for this range.
        </p>
      )}
    </section>
  );
}
