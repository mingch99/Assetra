import { useMemo, useState } from "react";
import type { Asset } from "@/types/asset";

type AllocationChartProps = {
    allAssets: Asset[];
    cashAmount?: number;
};

type Slice = {
    label: string;
    value: number;
    percentage: number;
    color: string;
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

function getEffectivePrice(asset: Asset) {
    return asset.currentPrice > 0 ? asset.currentPrice : asset.avgCost;
}

function getMarketValue(asset: Asset) {
    return getEffectivePrice(asset) * asset.quantity;
}

function buildDonutSlices(
    items: Array<{ label: string; value: number; color: string }>
): Slice[] {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    if (total <= 0) return [];

    return items.map((item) => ({
        ...item,
        percentage: (item.value / total) * 100,
    }));
}

function buildTopSlicesWithOthers(
    assets: Asset[],
    limit: number
): Slice[] {
    const sortedAssets = [...assets].sort(
        (a, b) => getMarketValue(b) - getMarketValue(a)
    );
    const totalValue = sortedAssets.reduce(
        (sum, asset) => sum + getMarketValue(asset),
        0
    );
    if (totalValue <= 0) return [];

    const topAssets = sortedAssets.slice(0, limit);
    const othersAssets = sortedAssets.slice(limit);

    const topSlices = topAssets.map((asset, index) => {
        const value = getMarketValue(asset);
        return {
            label: asset.symbol,
            value,
            percentage: (value / totalValue) * 100,
            color: getGoldColorByIndex(index, topAssets.length),
        };
    });

    const othersValue = othersAssets.reduce(
        (sum, asset) => sum + getMarketValue(asset),
        0
    );

    if (othersValue <= 0) return topSlices;

    return [
        ...topSlices,
        {
            label: "Others",
            value: othersValue,
            percentage: (othersValue / totalValue) * 100,
            color: "#6b7280",
        },
    ];
}

function DonutCard({ title, slices }: { title: string; slices: Slice[] }) {
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
                <p className="text-sm text-[var(--muted)]">目前沒有可顯示的資料。</p>
            ) : (
                <div className="flex items-center gap-4">
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
                            {arcSlices.map((slice) => (
                                <circle
                                    key={slice.label}
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill="transparent"
                                    stroke={slice.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={slice.dashArray}
                                    strokeDashoffset={slice.dashOffset}
                                    transform={`rotate(-90 ${center} ${center})`}
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
                                />
                            ))}
                        </svg>
                        <div className="pointer-events-none absolute inset-10 flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 text-center text-xs text-[var(--muted)]">
                            ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="flex-1 space-y-2">
                        {slices.map((slice) => (
                            <div
                                key={slice.label}
                                className="flex items-center justify-between text-sm cursor-default"
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
    cashAmount = 0,
}: AllocationChartProps) {
    const stockAssets = useMemo(
        () => allAssets.filter((asset) => asset.type === "Stock"),
        [allAssets]
    );
    const cryptoAssets = useMemo(
        () => allAssets.filter((asset) => asset.type === "Crypto"),
        [allAssets]
    );

    const stockValue = stockAssets.reduce((sum, asset) => sum + getMarketValue(asset), 0);
    const cryptoValue = cryptoAssets.reduce((sum, asset) => sum + getMarketValue(asset), 0);

    const allSlices = buildDonutSlices([
        { label: "Stock", value: stockValue, color: getGoldColorByRatio(0.1) },
        { label: "Crypto", value: cryptoValue, color: getGoldColorByRatio(0.45) },
        { label: "Cash", value: cashAmount, color: getGoldColorByRatio(0.8) },
    ]);

    const stockSlices = useMemo(() => buildTopSlicesWithOthers(stockAssets, 5), [stockAssets]);
    const cryptoSlices = useMemo(
        () => buildTopSlicesWithOthers(cryptoAssets, 5),
        [cryptoAssets]
    );

    return (
        <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-[var(--accent)]">Allocation</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <DonutCard title="ALL Assets" slices={allSlices} />
                <DonutCard title="Stock" slices={stockSlices} />
                <DonutCard title="Crypto" slices={cryptoSlices} />
            </div>
        </section>
    );
}
