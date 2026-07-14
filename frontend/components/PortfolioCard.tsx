import { useMemo, useState } from "react";
import {
  computeLiquidNonLiquid,
  sumAssetMarketValue,
} from "@/lib/asset-categories";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Asset } from "@/types/asset";
import type { QuoteMap } from "@/lib/api/quotes";

type PortfolioCardProps = {
  assets: Asset[];
  quotes: QuoteMap;
  cashAmount: number;
  debtAmount: number;
  realEstateAmount: number;
  onCashAmountChange: (value: number) => void;
  onDebtAmountChange: (value: number) => void;
  onRealEstateAmountChange: (value: number) => void;
};

type StackedBarSegment = {
  label: string;
  percentage: number;
  colorClassName: string;
  amount: number;
};

function StackedBar({
  title,
  segments,
}: {
  title: string;
  segments: StackedBarSegment[];
}) {
  const [hoveredSegment, setHoveredSegment] = useState<{
    label: string;
    amount: number;
    percentage: number;
    x: number;
    y: number;
  } | null>(null);
  const normalizedSegments = segments.map((segment) => ({
    ...segment,
    percentage: Math.max(0, Math.min(segment.percentage, 100)),
  }));

  return (
    <div>
      <p className="mb-2 text-sm text-[var(--muted)]">{title}</p>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--surface)]">
        {normalizedSegments.map((segment) => (
          <div
            key={segment.label}
            className={`${segment.colorClassName} cursor-pointer`}
            style={{ width: `${segment.percentage}%` }}
            onMouseEnter={(event) =>
              setHoveredSegment({
                label: segment.label,
                amount: segment.amount,
                percentage: segment.percentage,
                x: event.clientX,
                y: event.clientY,
              })
            }
            onMouseMove={(event) =>
              setHoveredSegment((previous) =>
                previous
                  ? { ...previous, x: event.clientX, y: event.clientY }
                  : {
                      label: segment.label,
                      amount: segment.amount,
                      percentage: segment.percentage,
                      x: event.clientX,
                      y: event.clientY,
                    }
              )
            }
            onMouseLeave={() => setHoveredSegment(null)}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {normalizedSegments.map((segment) => (
          <div
            key={segment.label}
            className="flex cursor-default items-center gap-1.5 text-xs"
            onMouseEnter={(event) =>
              setHoveredSegment({
                label: segment.label,
                amount: segment.amount,
                percentage: segment.percentage,
                x: event.clientX,
                y: event.clientY,
              })
            }
            onMouseMove={(event) =>
              setHoveredSegment((previous) =>
                previous
                  ? { ...previous, x: event.clientX, y: event.clientY }
                  : {
                      label: segment.label,
                      amount: segment.amount,
                      percentage: segment.percentage,
                      x: event.clientX,
                      y: event.clientY,
                    }
              )
            }
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${segment.colorClassName}`}
            />
            <span className="text-[var(--muted)]">{segment.label}</span>
            <span className="text-[var(--foreground)]">
              {segment.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
      {hoveredSegment && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--foreground)] shadow-lg"
          style={{
            left: hoveredSegment.x + 12,
            top: hoveredSegment.y + 12,
          }}
        >
          {hoveredSegment.label}: $
          {hoveredSegment.amount.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}{" "}
          ({hoveredSegment.percentage.toFixed(1)}%)
        </div>
      )}
    </div>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
      {label}
      <input
        type="number"
        min="0"
        value={value === 0 ? "" : String(value)}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "") {
            onChange(0);
            return;
          }
          const parsed = Number(next);
          if (Number.isFinite(parsed)) onChange(Math.max(0, parsed));
        }}
        className="w-32 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--foreground)]"
      />
    </label>
  );
}

export default function PortfolioCard({
  assets,
  quotes,
  cashAmount,
  debtAmount,
  realEstateAmount,
  onCashAmountChange,
  onDebtAmountChange,
  onRealEstateAmountChange,
}: PortfolioCardProps) {
  const { t } = useI18n();
  const pricedAssets = useMemo(
    () =>
      assets.map((asset) => {
        const live = quotes[asset.symbol.trim().toUpperCase()];
        return live ? { ...asset, currentPrice: live.price } : asset;
      }),
    [assets, quotes]
  );

  const totals = computeLiquidNonLiquid({
    assets: pricedAssets,
    cashAmount,
    realEstateAmount,
  });

  const costAssets = pricedAssets.filter((asset) => asset.type !== "Crypto");
  const totalCost = costAssets.reduce(
    (sum, asset) => sum + asset.avgCost * asset.quantity,
    0
  );
  const costMarketValue = costAssets.reduce(
    (sum, asset) =>
      sum +
      (asset.currentPrice > 0 ? asset.currentPrice : asset.avgCost) *
        asset.quantity,
    0
  );
  const unrealizedPnL = costMarketValue - totalCost;
  const unrealizedReturnPct =
    totalCost === 0 ? 0 : (unrealizedPnL / totalCost) * 100;

  const dailyPnL = pricedAssets.reduce((sum, asset) => {
    const changePct = quotes[asset.symbol.trim().toUpperCase()]?.changePct;
    if (typeof changePct !== "number" || asset.currentPrice <= 0) return sum;
    const prevClose = asset.currentPrice / (1 + changePct / 100);
    return sum + asset.quantity * (asset.currentPrice - prevClose);
  }, 0);
  const dailyReturnPct =
    totals.totalAssets === 0 ? 0 : (dailyPnL / totals.totalAssets) * 100;

  const stockValue = sumAssetMarketValue(pricedAssets, "Stock");
  const etfValue = sumAssetMarketValue(pricedAssets, "ETF");
  const cryptoValue = sumAssetMarketValue(pricedAssets, "Crypto");
  const pct = (amount: number) =>
    totals.totalAssets === 0 ? 0 : (amount / totals.totalAssets) * 100;

  const debtRatioPct =
    totals.totalAssets === 0
      ? debtAmount > 0
        ? 100
        : 0
      : Math.min((debtAmount / totals.totalAssets) * 100, 100);
  const equityRatioPct = 100 - debtRatioPct;
  const safeEquityAmount = Math.max(totals.totalAssets - debtAmount, 0);

  const liquidPct = pct(totals.liquidAssets);
  const nonLiquidPct = pct(totals.nonLiquidAssets);

  return (
    <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-2xl font-semibold text-[var(--accent)]">
          {t("summaryTitle")}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <MoneyInput
            label={t("cash")}
            value={cashAmount}
            onChange={onCashAmountChange}
          />
          <MoneyInput
            label={t("debt")}
            value={debtAmount}
            onChange={onDebtAmountChange}
          />
          <MoneyInput
            label={t("realEstate")}
            value={realEstateAmount}
            onChange={onRealEstateAmountChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <h3 className="text-sm text-[var(--muted)]">{t("totalAssetsValue")}</h3>
          <p className="mt-2 text-3xl font-bold text-[var(--accent)]">
            $
            {totals.totalAssets.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <h3 className="text-sm text-[var(--muted)]">{t("dailyPnl")}</h3>
          <p
            className={`mt-2 text-3xl font-bold ${
              dailyPnL >= 0 ? "text-green-500" : "text-red-400"
            }`}
          >
            {dailyPnL >= 0 ? "+" : "-"}$
            {Math.abs(dailyPnL).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>
          <p
            className={`mt-1 text-sm font-semibold ${
              dailyReturnPct >= 0 ? "text-green-500" : "text-red-400"
            }`}
          >
            {dailyReturnPct >= 0 ? "+" : "-"}
            {Math.abs(dailyReturnPct).toFixed(2)}%
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <h3 className="text-sm text-[var(--muted)]">{t("unrealizedPnl")}</h3>
          <p
            className={`mt-2 text-3xl font-bold ${
              unrealizedPnL >= 0 ? "text-green-500" : "text-red-400"
            }`}
          >
            {unrealizedPnL >= 0 ? "+" : "-"}$
            {Math.abs(unrealizedPnL).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>
          <p
            className={`mt-1 text-sm font-semibold ${
              unrealizedReturnPct >= 0 ? "text-green-500" : "text-red-400"
            }`}
          >
            {unrealizedReturnPct >= 0 ? "+" : "-"}
            {Math.abs(unrealizedReturnPct).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
        <div className="space-y-4">
          <StackedBar
            title={t("assetAllocation")}
            segments={[
              {
                label: t("stock"),
                percentage: pct(stockValue),
                colorClassName: "bg-yellow-300",
                amount: stockValue,
              },
              {
                label: t("etf"),
                percentage: pct(etfValue),
                colorClassName: "bg-yellow-400",
                amount: etfValue,
              },
              {
                label: t("crypto"),
                percentage: pct(cryptoValue),
                colorClassName: "bg-yellow-500",
                amount: cryptoValue,
              },
              {
                label: t("cash"),
                percentage: pct(cashAmount),
                colorClassName: "bg-yellow-700",
                amount: cashAmount,
              },
              {
                label: t("realEstate"),
                percentage: pct(realEstateAmount),
                colorClassName: "bg-amber-900",
                amount: realEstateAmount,
              },
            ]}
          />

          <StackedBar
            title={t("liquidNonLiquid")}
            segments={[
              {
                label: t("liquid"),
                percentage: liquidPct,
                colorClassName: "bg-yellow-400",
                amount: totals.liquidAssets,
              },
              {
                label: t("nonLiquid"),
                percentage: nonLiquidPct,
                colorClassName: "bg-amber-800",
                amount: totals.nonLiquidAssets,
              },
            ]}
          />

          <StackedBar
            title={t("equityDebt")}
            segments={[
              {
                label: t("equity"),
                percentage: equityRatioPct,
                colorClassName: "bg-yellow-400",
                amount: safeEquityAmount,
              },
              {
                label: t("debt"),
                percentage: debtRatioPct,
                colorClassName: "bg-amber-800",
                amount: debtAmount,
              },
            ]}
          />
        </div>
      </div>
    </section>
  );
}