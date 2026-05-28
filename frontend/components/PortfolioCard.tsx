import { useState } from "react";
import type { Asset } from "@/types/asset";

type PortfolioCardProps = {
    assets: Asset[];
    cashAmount: number;
    debtAmount: number;
    onCashAmountChange: (value: number) => void;
    onDebtAmountChange: (value: number) => void;
};

type StackedBarSegment = {
    label: string;
    percentage: number;
    colorClassName: string;
    amount: number;
};

function getEffectivePrice(asset: Asset) {
    return asset.currentPrice > 0 ? asset.currentPrice : asset.avgCost;
}

function getMockDailyChangePct(symbol: string) {
    const hash = Array.from(symbol).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const normalized = (hash % 700) / 100 - 3.5;
    return Number(normalized.toFixed(2));
}

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
                                    ? {
                                          ...previous,
                                          x: event.clientX,
                                          y: event.clientY,
                                      }
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
                                    ? {
                                          ...previous,
                                          x: event.clientX,
                                          y: event.clientY,
                                      }
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
                        <span className={`inline-block h-2 w-2 rounded-full ${segment.colorClassName}`} />
                        <span className="text-[var(--muted)]">{segment.label}</span>
                        <span className="text-[var(--foreground)]">{segment.percentage.toFixed(1)}%</span>
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

export default function PortfolioCard({
    assets,
    cashAmount,
    debtAmount,
    onCashAmountChange,
    onDebtAmountChange,
}: PortfolioCardProps) {
    const totalCost = assets.reduce(
        (sum, asset) => sum + asset.avgCost * asset.quantity,
        0
    );

    const totalValue = assets.reduce(
        (sum, asset) => sum + getEffectivePrice(asset) * asset.quantity,
        0
    );

    const unrealizedPnL = totalValue - totalCost;
    const unrealizedReturnPct = totalCost === 0 ? 0 : (unrealizedPnL / totalCost) * 100;
    const totalAssetsWithCash = totalValue + cashAmount;

    const dailyPnL = assets.reduce((sum, asset) => {
        const marketValue = getEffectivePrice(asset) * asset.quantity;
        return sum + marketValue * (getMockDailyChangePct(asset.symbol) / 100);
    }, 0);
    const dailyReturnPct =
        totalAssetsWithCash === 0 ? 0 : (dailyPnL / totalAssetsWithCash) * 100;

    const stockValue = assets
        .filter((asset) => asset.type === "Stock")
        .reduce((sum, asset) => sum + getEffectivePrice(asset) * asset.quantity, 0);
    const cryptoValue = assets
        .filter((asset) => asset.type === "Crypto")
        .reduce((sum, asset) => sum + getEffectivePrice(asset) * asset.quantity, 0);

    const stockAllocationPct =
        totalAssetsWithCash === 0 ? 0 : (stockValue / totalAssetsWithCash) * 100;
    const cryptoAllocationPct =
        totalAssetsWithCash === 0 ? 0 : (cryptoValue / totalAssetsWithCash) * 100;
    const cashAllocationPct =
        totalAssetsWithCash === 0 ? 0 : (cashAmount / totalAssetsWithCash) * 100;

    const debtRatioPct =
        totalAssetsWithCash === 0
            ? debtAmount > 0
                ? 100
                : 0
            : Math.min((debtAmount / totalAssetsWithCash) * 100, 100);
    const equityRatioPct = 100 - debtRatioPct;
    const safeEquityAmount = Math.max(totalAssetsWithCash - debtAmount, 0);

    return (
        <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <h2 className="text-2xl font-semibold text-[var(--accent)]">Summary</h2>
                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                        Cash
                        <input
                            type="number"
                            min="0"
                            value={cashAmount === 0 ? "" : String(cashAmount)}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                    onCashAmountChange(0);
                                    return;
                                }
                                const parsed = Number(value);
                                if (Number.isFinite(parsed)) {
                                    onCashAmountChange(Math.max(0, parsed));
                                }
                            }}
                            className="w-32 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--foreground)]"
                        />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                        Debt
                        <input
                            type="number"
                            min="0"
                            value={debtAmount === 0 ? "" : String(debtAmount)}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                    onDebtAmountChange(0);
                                    return;
                                }
                                const parsed = Number(value);
                                if (Number.isFinite(parsed)) {
                                    onDebtAmountChange(Math.max(0, parsed));
                                }
                            }}
                            className="w-32 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--foreground)]"
                        />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <h3 className="text-sm text-[var(--muted)]">Total Assets Value</h3>
                    <p className="mt-2 text-3xl font-bold text-[var(--accent)]">
                        $
                        {totalAssetsWithCash.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                        })}
                    </p>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <h3 className="text-sm text-[var(--muted)]">Daily P&amp;L</h3>
                    <p
                        className={`mt-2 text-3xl font-bold ${dailyPnL >= 0 ? "text-green-500" : "text-red-400"
                            }`}
                    >
                        {dailyPnL >= 0 ? "+" : "-"}$
                        {Math.abs(dailyPnL).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                        })}
                    </p>
                    <p
                        className={`mt-1 text-sm font-semibold ${dailyReturnPct >= 0 ? "text-green-500" : "text-red-400"
                            }`}
                    >
                        {dailyReturnPct >= 0 ? "+" : "-"}
                        {Math.abs(dailyReturnPct).toFixed(2)}%
                    </p>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <h3 className="text-sm text-[var(--muted)]">Unrealized P&amp;L</h3>
                    <p
                        className={`mt-2 text-3xl font-bold ${unrealizedPnL >= 0 ? "text-green-500" : "text-red-400"
                            }`}
                    >
                        {unrealizedPnL >= 0 ? "+" : "-"}$
                        {Math.abs(unrealizedPnL).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                        })}
                    </p>
                    <p
                        className={`mt-1 text-sm font-semibold ${unrealizedReturnPct >= 0 ? "text-green-500" : "text-red-400"
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
                        title="Asset Allocation"
                        segments={[
                            {
                                label: "Stock",
                                percentage: stockAllocationPct,
                                colorClassName: "bg-yellow-300",
                                amount: stockValue,
                            },
                            {
                                label: "Crypto",
                                percentage: cryptoAllocationPct,
                                colorClassName: "bg-yellow-500",
                                amount: cryptoValue,
                            },
                            {
                                label: "Cash",
                                percentage: cashAllocationPct,
                                colorClassName: "bg-yellow-700",
                                amount: cashAmount,
                            },
                        ]}
                    />

                    <StackedBar
                        title="Equity / Debit"
                        segments={[
                            {
                                label: "Equity",
                                percentage: equityRatioPct,
                                colorClassName: "bg-yellow-400",
                                amount: safeEquityAmount,
                            },
                            {
                                label: "Debt",
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