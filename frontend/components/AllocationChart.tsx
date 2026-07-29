"use client";

import { useMemo, useState } from "react";
import {
  buildGroupedAllocationItems,
  sumAssetMarketValue,
} from "@/lib/asset-categories";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Asset, AssetGroup } from "@/types/asset";

type AllocationChartProps = {
  allAssets: Asset[];
  groups: AssetGroup[];
  cashAmount?: number;
  realEstateAmount?: number;
};

type Slice = {
  label: string;
  value: number;
  percentage: number;
  color: string;
  hideInLegend?: boolean;
};

function getGoldColorByRatio(ratio: number) {
  const clampedRatio = Math.min(Math.max(ratio, 0), 1);
  const hue = 45;
  const saturation = 92 - clampedRatio * 30;
  const lightness = 62 - clampedRatio * 42;
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

function getGoldColorByIndex(index: number, total: number) {
  const safeTotal = Math.max(total, 1);
  const ratio = safeTotal === 1 ? 0 : index / (safeTotal - 1);
  return getGoldColorByRatio(ratio);
}

function buildDonutSlices(
  items: Array<{ label: string; value: number; color?: string }>
): Slice[] {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return [];

  return items.map((item, index) => ({
    label: item.label,
    value: item.value,
    percentage: (item.value / total) * 100,
    color: item.color ?? getGoldColorByIndex(index, items.length),
  }));
}

function buildTopSlicesWithOthers(
  items: Array<{ label: string; value: number }>,
  limit: number,
  othersLabel: string,
  options?: { hideOthersInLegend?: boolean }
): Slice[] {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const totalValue = sorted.reduce((sum, item) => sum + item.value, 0);
  if (totalValue <= 0) return [];

  const top = sorted.slice(0, limit);
  const others = sorted.slice(limit);
  const topSlices = top.map((item, index) => ({
    label: item.label,
    value: item.value,
    percentage: (item.value / totalValue) * 100,
    color: getGoldColorByIndex(index, top.length),
  }));

  const othersValue = others.reduce((sum, item) => sum + item.value, 0);
  if (othersValue <= 0) return topSlices;

  return [
    ...topSlices,
    {
      label: othersLabel,
      value: othersValue,
      percentage: (othersValue / totalValue) * 100,
      color: "#6b7280",
      hideInLegend: options?.hideOthersInLegend === true,
    },
  ];
}

function DonutCard({
  title,
  slices,
  noDataLabel,
}: {
  title: string;
  slices: Slice[];
  noDataLabel: string;
}) {
  const [hoveredSlice, setHoveredSlice] = useState<{
    label: string;
    value: number;
    percentage: number;
    x: number;
    y: number;
  } | null>(null);
  const donutSize = 220;
  const center = donutSize / 2;
  const radius = 72;
  const strokeWidth = 38;
  const circumference = 2 * Math.PI * radius;
  const totalValue = slices.reduce((sum, slice) => sum + slice.value, 0);

  const arcSlices = slices.reduce<
    Array<Slice & { dashArray: string; dashOffset: number }>
  >((acc, slice) => {
    const startPercentage = acc.reduce(
      (sum, currentSlice) => sum + currentSlice.percentage,
      0
    );
    const segmentLength = (slice.percentage / 100) * circumference;
    const dashArray = `${segmentLength} ${circumference - segmentLength}`;
    const dashOffset = -((startPercentage / 100) * circumference);
    acc.push({ ...slice, dashArray, dashOffset });
    return acc;
  }, []);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <h3 className="mb-3 text-lg font-semibold text-[var(--accent)]">{title}</h3>
      {slices.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">{noDataLabel}</p>
      ) : (
        <div className="flex flex-col items-center gap-4 lg:flex-row">
          <div className="relative h-56 w-56 shrink-0">
            <svg className="h-56 w-56" viewBox={`0 0 ${donutSize} ${donutSize}`}>
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="rgba(212, 175, 55, 0.2)"
                strokeWidth={strokeWidth}
              />
              {arcSlices.map((slice, index) => (
                <circle
                  key={`${slice.label}-${index}`}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={slice.dashArray}
                  strokeDashoffset={slice.dashOffset}
                  transform={`rotate(-90 ${center} ${center})`}
                  onMouseEnter={(event) => {
                    if (slice.hideInLegend) return;
                    setHoveredSlice({
                      label: slice.label,
                      value: slice.value,
                      percentage: slice.percentage,
                      x: event.clientX,
                      y: event.clientY,
                    });
                  }}
                  onMouseMove={(event) => {
                    if (slice.hideInLegend) return;
                    setHoveredSlice((previous) =>
                      previous
                        ? {
                            ...previous,
                            x: event.clientX,
                            y: event.clientY,
                          }
                        : {
                            label: slice.label,
                            value: slice.value,
                            percentage: slice.percentage,
                            x: event.clientX,
                            y: event.clientY,
                          }
                    );
                  }}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-10 flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 text-center text-xs text-[var(--muted)]">
              $
              {totalValue.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="w-full flex-1 space-y-2">
            {slices
              .filter((slice) => !slice.hideInLegend)
              .map((slice, index) => (
              <div
                key={`${slice.label}-${index}`}
                className="flex cursor-default items-center justify-between text-sm"
                onMouseEnter={(event) =>
                  setHoveredSlice({
                    label: slice.label,
                    value: slice.value,
                    percentage: slice.percentage,
                    x: event.clientX,
                    y: event.clientY,
                  })
                }
                onMouseMove={(event) =>
                  setHoveredSlice((previous) =>
                    previous
                      ? {
                          ...previous,
                          x: event.clientX,
                          y: event.clientY,
                        }
                      : {
                          label: slice.label,
                          value: slice.value,
                          percentage: slice.percentage,
                          x: event.clientX,
                          y: event.clientY,
                        }
                  )
                }
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-[var(--foreground)]">{slice.label}</span>
                </div>
                <span className="text-[var(--muted)]">
                  {slice.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {hoveredSlice && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--foreground)] shadow-lg"
          style={{
            left: hoveredSlice.x + 12,
            top: hoveredSlice.y + 12,
          }}
        >
          {hoveredSlice.label}: $
          {hoveredSlice.value.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}{" "}
          ({hoveredSlice.percentage.toFixed(1)}%)
        </div>
      )}
    </div>
  );
}

export default function AllocationChart({
  allAssets,
  groups,
  cashAmount = 0,
  realEstateAmount = 0,
}: AllocationChartProps) {
  const { t } = useI18n();
  const othersLabel = t("others");
  const noDataLabel = t("noDataToDisplay");

  const allSlices = useMemo(() => {
    return buildDonutSlices([
      {
        label: t("stocks"),
        value: sumAssetMarketValue(allAssets, "Stock"),
        color: getGoldColorByRatio(0.05),
      },
      {
        label: t("etfs"),
        value: sumAssetMarketValue(allAssets, "ETF"),
        color: getGoldColorByRatio(0.25),
      },
      {
        label: t("crypto"),
        value: sumAssetMarketValue(allAssets, "Crypto"),
        color: getGoldColorByRatio(0.45),
      },
      { label: t("cash"), value: cashAmount, color: getGoldColorByRatio(0.7) },
      {
        label: t("realEstate"),
        value: realEstateAmount,
        color: getGoldColorByRatio(0.9),
      },
    ]);
  }, [allAssets, cashAmount, realEstateAmount, t]);

  const stockSlices = useMemo(() => {
    const stocks = allAssets.filter((asset) => asset.type === "Stock");
    return buildTopSlicesWithOthers(
      buildGroupedAllocationItems(stocks, groups),
      5,
      othersLabel,
      { hideOthersInLegend: true }
    );
  }, [allAssets, groups, othersLabel]);

  const etfSlices = useMemo(() => {
    const etfs = allAssets.filter((asset) => asset.type === "ETF");
    return buildTopSlicesWithOthers(
      buildGroupedAllocationItems(etfs, groups),
      5,
      othersLabel
    );
  }, [allAssets, groups, othersLabel]);

  const cryptoSlices = useMemo(() => {
    const cryptos = allAssets.filter((asset) => asset.type === "Crypto");
    const items = buildGroupedAllocationItems(cryptos, groups, {
      useCryptoBuckets: true,
    }).map((item) => {
      if (item.label === "Altcoins") return { ...item, label: t("altcoins") };
      if (item.label === "USD") return { ...item, label: t("usd") };
      if (item.label === "Group") return { ...item, label: t("group") };
      return item;
    });
    return buildTopSlicesWithOthers(items, 5, othersLabel);
  }, [allAssets, groups, othersLabel, t]);

  return (
    <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-[var(--accent)]">
          {t("allocationTitle")}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        <DonutCard
          title={t("allAssets")}
          slices={allSlices}
          noDataLabel={noDataLabel}
        />
        <DonutCard
          title={t("stocks")}
          slices={stockSlices}
          noDataLabel={noDataLabel}
        />
        <DonutCard
          title={t("etfs")}
          slices={etfSlices}
          noDataLabel={noDataLabel}
        />
        <DonutCard
          title={t("crypto")}
          slices={cryptoSlices}
          noDataLabel={noDataLabel}
        />
      </div>
    </section>
  );
}
