"use client";

import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { PortfolioRiskMetrics } from "@/lib/api/portfolio";
import type { MessageKey } from "@/lib/i18n/messages/en";

type ReturnVolatilityCardProps = {
  metrics: PortfolioRiskMetrics | null;
  isLoading?: boolean;
};

type MetricBlock = {
  returnLabel: MessageKey;
  volLabel: MessageKey;
  returnValue: number | null | undefined;
  volValue: number | null | undefined;
};

function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const pct = value * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function formatVolPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(2)}%`;
}

function returnColorClass(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value === 0) {
    return "text-[var(--foreground)]";
  }
  return value > 0 ? "text-emerald-400" : "text-red-400";
}

export default function ReturnVolatilityCard({
  metrics,
  isLoading = false,
}: ReturnVolatilityCardProps) {
  const { t } = useI18n();
  const hasData =
    metrics != null &&
    (metrics.return7d != null ||
      metrics.return30d != null ||
      metrics.returnYtd != null ||
      metrics.return1y != null);

  const blocks: MetricBlock[] = [
    {
      returnLabel: "returnVol7d",
      volLabel: "returnVolVolatility7d",
      returnValue: metrics?.return7d,
      volValue: metrics?.volatility7d,
    },
    {
      returnLabel: "returnVol30d",
      volLabel: "returnVolVolatility30d",
      returnValue: metrics?.return30d,
      volValue: metrics?.volatility30d,
    },
    {
      returnLabel: "returnVolYtd",
      volLabel: "returnVolVolatilityYtd",
      returnValue: metrics?.returnYtd,
      volValue: metrics?.volatilityYtd,
    },
    {
      returnLabel: "returnVol1y",
      volLabel: "returnVolVolatility1y",
      returnValue: metrics?.return1y,
      volValue: metrics?.volatility1y,
    },
  ];

  return (
    <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-2xl font-semibold text-[var(--accent)]">
          {t("returnVolTitle")}
        </h2>
        {metrics?.asOf && (
          <p className="text-xs text-[var(--muted)]">
            {t("returnVolAsOf", { date: metrics.asOf })}
          </p>
        )}
      </div>

      {isLoading && !hasData ? (
        <p className="text-sm text-[var(--muted)]">{t("returnVolLoading")}</p>
      ) : !hasData ? (
        <p className="text-sm text-[var(--muted)]">{t("returnVolEmpty")}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {blocks.map((block) => (
              <div
                key={block.returnLabel}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4"
              >
                <h3 className="text-sm text-[var(--muted)]">
                  {t(block.returnLabel)}
                </h3>
                <p
                  className={`mt-2 text-3xl font-bold ${returnColorClass(block.returnValue)}`}
                >
                  {formatPct(block.returnValue)}
                </p>
                <div className="mt-3 border-t border-[var(--border)] pt-3">
                  <p className="text-xs text-[var(--muted)]">
                    {t(block.volLabel)}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                    {formatVolPct(block.volValue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {metrics && metrics.coveredWeight < 0.999 && (
            <p className="mt-3 text-xs text-[var(--muted)]">
              {t("returnVolCoverage", {
                pct: (metrics.coveredWeight * 100).toFixed(0),
              })}
            </p>
          )}
        </>
      )}
    </section>
  );
}
