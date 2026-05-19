import { useState } from "react";
import type { Asset, AssetTab } from "@/types/asset";

type AllocationChartProps = {
    allAssets: Asset[];
    activeTab: AssetTab;
};

type Slice = {
    label: string;
    value: number;
    percentage: number;
    color: string;
};

type TooltipPosition = {
    x: number;
    y: number;
};

const chartColors = [
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#dc2626",
    "#7c3aed",
    "#0ea5e9",
];

function getMarketValue(asset: Asset) {
    return asset.currentPrice * asset.quantity;
}

export default function AllocationChart({ allAssets, activeTab }: AllocationChartProps) {
    const [hoveredSlice, setHoveredSlice] = useState<Slice | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
        x: 0,
        y: 0,
    });

    const filteredAssets =
        activeTab === "All"
            ? allAssets
            : allAssets.filter((asset) => asset.type === activeTab);

    const sortedAssets = [...filteredAssets].sort(
        (a, b) => getMarketValue(b) - getMarketValue(a)
    );

    let slices: Slice[] = [];
    let totalValue = 0;

    if (activeTab === "All") {
        const stockValue = allAssets
            .filter((asset) => asset.type === "Stock")
            .reduce((sum, asset) => sum + getMarketValue(asset), 0);
        const cryptoValue = allAssets
            .filter((asset) => asset.type === "Crypto")
            .reduce((sum, asset) => sum + getMarketValue(asset), 0);

        totalValue = stockValue + cryptoValue;

        const rawSlices = [
            { label: "Stock", value: stockValue, color: chartColors[0] },
            { label: "Crypto", value: cryptoValue, color: chartColors[1] },
        ].filter((slice) => slice.value > 0);

        slices = rawSlices.map((slice) => ({
            ...slice,
            percentage: totalValue === 0 ? 0 : (slice.value / totalValue) * 100,
        }));
    } else {
        const topAssets = sortedAssets.slice(0, 5);
        const othersAssets = sortedAssets.slice(5);

        totalValue = sortedAssets.reduce(
            (sum, asset) => sum + getMarketValue(asset),
            0
        );

        const topSlices: Slice[] = topAssets.map((asset, index) => {
            const value = getMarketValue(asset);
            const percentage = totalValue === 0 ? 0 : (value / totalValue) * 100;

            return {
                label: asset.symbol,
                value,
                percentage,
                color: chartColors[index % chartColors.length],
            };
        });

        const othersValue = othersAssets.reduce(
            (sum, asset) => sum + getMarketValue(asset),
            0
        );

        slices =
            othersValue > 0
                ? [
                    ...topSlices,
                    {
                        label: "Others",
                        value: othersValue,
                        percentage:
                            totalValue === 0 ? 0 : (othersValue / totalValue) * 100,
                        color: chartColors[5],
                    },
                ]
                : topSlices;
    }

    let cumulative = 0;
    const gradientStops = slices.map((slice) => {
        const start = cumulative;
        cumulative += slice.percentage;
        return `${slice.color} ${start}% ${cumulative}%`;
    });

    const hasData = totalValue > 0;
    const donutBackground = hasData
        ? `conic-gradient(${gradientStops.join(", ")})`
        : "#e5e7eb";
    const topLabels = slices.slice(0, 3);
    const title =
        activeTab === "All"
            ? "Allocation (By Type)"
            : `Allocation (${activeTab} Top Holdings)`;

    const donutSize = 260;
    const center = donutSize / 2;
    const radius = 88;
    const strokeWidth = 44;
    const circumference = 2 * Math.PI * radius;

    let startPercentage = 0;
    const arcSlices = slices.map((slice) => {
        const segmentLength = (slice.percentage / 100) * circumference;
        const dashArray = `${segmentLength} ${circumference - segmentLength}`;
        const dashOffset = -((startPercentage / 100) * circumference);
        startPercentage += slice.percentage;

        return {
            ...slice,
            dashArray,
            dashOffset,
        };
    });

    return (
        <section className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">{title}</h2>

            {!hasData && (
                <p className="text-gray-500">
                    尚未有資產，新增後即可查看占比。
                </p>
            )}

            {hasData && (
                <div className="flex justify-center">
                    <div className="relative h-72 w-72">
                        <svg
                            className="h-72 w-72"
                            viewBox={`0 0 ${donutSize} ${donutSize}`}
                        >
                            <circle
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="transparent"
                                stroke="#e5e7eb"
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
                                    onMouseEnter={(e) => {
                                        setHoveredSlice(slice);
                                        setTooltipPosition({
                                            x: e.clientX + 12,
                                            y: e.clientY + 12,
                                        });
                                    }}
                                    onMouseMove={(e) => {
                                        setTooltipPosition({
                                            x: e.clientX + 12,
                                            y: e.clientY + 12,
                                        });
                                    }}
                                    onMouseLeave={() => setHoveredSlice(null)}
                                    className="cursor-pointer transition-opacity hover:opacity-90"
                                />
                            ))}
                        </svg>

                        <div className="absolute inset-12 rounded-full bg-white flex flex-col items-center justify-center px-4 text-center pointer-events-none">
                            <div className="text-xs text-gray-500">Top Weights</div>
                            <div className="mt-1 space-y-1">
                                {topLabels.map((slice) => (
                                    <div key={slice.label} className="text-xs font-medium">
                                        {slice.label} {slice.percentage.toFixed(1)}%
                                    </div>
                                ))}
                            </div>
                        </div>

                        {hoveredSlice && (
                            <div
                                className="fixed z-50 rounded-lg bg-black px-3 py-2 text-white shadow-lg pointer-events-none"
                                style={{
                                    left: tooltipPosition.x,
                                    top: tooltipPosition.y,
                                }}
                            >
                                <div className="text-xs font-semibold">{hoveredSlice.label}</div>
                                <div className="text-xs">
                                    {hoveredSlice.percentage.toFixed(2)}%
                                </div>
                                <div className="text-xs">
                                    $
                                    {hoveredSlice.value.toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
