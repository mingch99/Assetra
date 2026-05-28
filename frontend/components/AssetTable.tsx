import { useEffect, useMemo, useState } from "react";
import AssetForm from "@/components/AssetForm";
import type { Asset, AssetTab, NewAsset } from "@/types/asset";

type AssetTableProps = {
    assets: Asset[];
    onDeleteAsset: (assetId: string) => Promise<void>;
    onUpdateAsset: (asset: Asset) => Promise<void>;
    onAddAsset: (asset: NewAsset) => Promise<void>;
};

type SortDirection = "asc" | "desc";
type SortKey =
    | "instrument"
    | "position"
    | "avgPrice"
    | "pl"
    | "dailyChange"
    | "costBasis"
    | "marketValue"
    | "unrealizedPL"
    | "unrealizedPLPct";

type EditFormState = {
    quantity: string;
    avgCost: string;
};

const filterOptions: AssetTab[] = ["All", "Stock", "Crypto"];

function getCostBasis(asset: Asset) {
    return asset.quantity * asset.avgCost;
}

function getMarketValue(asset: Asset) {
    const effectivePrice = asset.currentPrice > 0 ? asset.currentPrice : asset.avgCost;
    return asset.quantity * effectivePrice;
}

function getUnrealizedPL(asset: Asset) {
    return getMarketValue(asset) - getCostBasis(asset);
}

function getUnrealizedPLPct(asset: Asset) {
    const costBasis = getCostBasis(asset);
    if (costBasis === 0) return 0;
    return (getUnrealizedPL(asset) / costBasis) * 100;
}

function getMockDailyChangePct(symbol: string) {
    const sum = symbol
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ((sum % 120) - 60) / 10;
}

function getMockYtdChangePct(symbol: string) {
    const sum = symbol
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ((sum % 260) - 80) / 10;
}

function formatSignedNumber(value: number, suffix = "") {
    const sign = value >= 0 ? "+" : "-";
    return `${sign}${Math.abs(value).toFixed(2)}${suffix}`;
}

export default function AssetTable({
    assets,
    onDeleteAsset,
    onUpdateAsset,
    onAddAsset,
}: AssetTableProps) {
    const [filterTab, setFilterTab] = useState<AssetTab>("All");
    const [sortKey, setSortKey] = useState<SortKey>("marketValue");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
    const [openMenuAssetId, setOpenMenuAssetId] = useState<string | null>(null);
    const [editError, setEditError] = useState("");
    const [editForm, setEditForm] = useState<EditFormState>({
        quantity: "",
        avgCost: "",
    });

    const filteredAssets = useMemo(() => {
        if (filterTab === "All") return assets;
        return assets.filter((asset) => asset.type === filterTab);
    }, [assets, filterTab]);

    const sortedAssets = useMemo(() => {
        const clonedAssets = [...filteredAssets];

        function getSortValue(asset: Asset) {
            switch (sortKey) {
                case "instrument":
                    return asset.symbol;
                case "position":
                    return asset.quantity;
                case "avgPrice":
                    return asset.avgCost;
                case "pl":
                    return getUnrealizedPL(asset);
                case "dailyChange":
                    return getMockDailyChangePct(asset.symbol);
                case "costBasis":
                    return getCostBasis(asset);
                case "marketValue":
                    return getMarketValue(asset);
                case "unrealizedPL":
                    return getUnrealizedPL(asset);
                case "unrealizedPLPct":
                    return getUnrealizedPLPct(asset);
                default:
                    return 0;
            }
        }

        clonedAssets.sort((a, b) => {
            const direction = sortDirection === "asc" ? 1 : -1;
            const valueA = getSortValue(a);
            const valueB = getSortValue(b);

            if (typeof valueA === "string" && typeof valueB === "string") {
                return valueA.localeCompare(valueB) * direction;
            }
            return ((valueA as number) - (valueB as number)) * direction;
        });

        return clonedAssets;
    }, [filteredAssets, sortDirection, sortKey]);

    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            const target = event.target as HTMLElement;
            if (target.closest("[data-asset-menu]")) return;
            setOpenMenuAssetId(null);
        }

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    function toggleSort(nextSortKey: SortKey) {
        if (sortKey === nextSortKey) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }
        setSortKey(nextSortKey);
        setSortDirection("desc");
    }

    function startEditing(asset: Asset) {
        setEditingAssetId(asset.id);
        setOpenMenuAssetId(null);
        setEditError("");
        setEditForm({
            quantity: String(asset.quantity),
            avgCost: String(asset.avgCost),
        });
    }

    function cancelEditing() {
        setEditingAssetId(null);
        setEditError("");
    }

    async function saveEditing(asset: Asset) {
        const quantity = Number(editForm.quantity);
        const avgCost = Number(editForm.avgCost);

        if (Number.isNaN(quantity) || quantity <= 0) {
            setEditError("Position 必須大於 0。");
            return;
        }

        if (Number.isNaN(avgCost) || avgCost < 0) {
            setEditError("Avg. Price 不可小於 0。");
            return;
        }

        try {
            await onUpdateAsset({
                ...asset,
                quantity,
                avgCost,
            });
            cancelEditing();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "更新資產失敗，請稍後再試。";
            setEditError(message);
        }
    }

    async function confirmDelete(asset: Asset) {
        setOpenMenuAssetId(null);
        const confirmed = window.confirm(
            `是否確定要刪除資產 ${asset.symbol} (${asset.name})？`
        );
        if (confirmed) {
            try {
                await onDeleteAsset(asset.id);
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "刪除資產失敗，請稍後再試。";
                setEditError(message);
            }
        }
    }

    function renderSortHeader(label: string, sortTarget: SortKey) {
        const isActive = sortKey === sortTarget;
        return (
            <button
                type="button"
                className="inline-flex items-center gap-1 hover:text-[var(--foreground)]"
                onClick={() => toggleSort(sortTarget)}
            >
                <span>{label}</span>
                <span className="text-xs">{isActive ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span>
            </button>
        );
    }

    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-md p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-[var(--accent)]">Asset Table</h2>
                <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--muted)]">
                        <span>Filter</span>
                        <select
                            className="rounded bg-transparent text-[var(--foreground)] outline-none"
                            value={filterTab}
                            onChange={(e) => setFilterTab(e.target.value as AssetTab)}
                        >
                            {filterOptions.map((option) => (
                                <option key={option} value={option} className="text-black">
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>
                    <AssetForm
                        onAddAsset={onAddAsset}
                        existingSymbols={assets.map((asset) => asset.symbol)}
                    />
                </div>
            </div>

            {sortedAssets.length === 0 && (
                <p className="mb-4 text-[var(--muted)]">尚未有資產，請先新增一筆資料。</p>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-[1500px] w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                            <th className="py-3">Type</th>
                            <th className="py-3">{renderSortHeader("Instrument", "instrument")}</th>
                            <th className="py-3">{renderSortHeader("Position", "position")}</th>
                            <th className="py-3">{renderSortHeader("Avg Price", "avgPrice")}</th>
                            <th className="py-3">{renderSortHeader("P&L", "pl")}</th>
                            <th className="py-3">{renderSortHeader("Daily Change (%)", "dailyChange")}</th>
                            <th className="py-3">{renderSortHeader("Cost Basis", "costBasis")}</th>
                            <th className="py-3">{renderSortHeader("Market Value", "marketValue")}</th>
                            <th className="py-3">{renderSortHeader("Unrealized P&L", "unrealizedPL")}</th>
                            <th className="py-3">{renderSortHeader("Unrealized P&L (%)", "unrealizedPLPct")}</th>
                            <th className="py-3">YTD Change (%)</th>
                            <th className="py-3 w-12" />
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAssets.map((asset) => {
                            const isEditing = editingAssetId === asset.id;
                            const costBasis = getCostBasis(asset);
                            const marketValue = getMarketValue(asset);
                            const unrealizedPL = getUnrealizedPL(asset);
                            const unrealizedPLPct = getUnrealizedPLPct(asset);
                            const dailyChangePct = getMockDailyChangePct(asset.symbol);
                            const ytdChangePct = getMockYtdChangePct(asset.symbol);

                            return (
                                <tr key={asset.id} className="border-b border-[var(--border)]">
                                    <td className="py-4">{asset.type}</td>
                                    <td className="py-4">
                                        <div>
                                            <div className="font-semibold">{asset.symbol}</div>
                                            <div className="text-sm text-[var(--muted)]">{asset.name}</div>
                                        </div>
                                        {isEditing && (
                                            <div className="mt-2 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={cancelEditing}
                                                    className="rounded border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => saveEditing(asset)}
                                                    className="rounded bg-[var(--accent)] px-3 py-1 text-xs font-medium text-black hover:bg-[var(--accent-hover)]"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={editForm.quantity}
                                                onChange={(e) =>
                                                    setEditForm((prev) => ({ ...prev, quantity: e.target.value }))
                                                }
                                                className="w-24 rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-sm text-[var(--foreground)]"
                                            />
                                        ) : (
                                            asset.quantity
                                        )}
                                    </td>
                                    <td className="py-4">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={editForm.avgCost}
                                                onChange={(e) =>
                                                    setEditForm((prev) => ({ ...prev, avgCost: e.target.value }))
                                                }
                                                className="w-24 rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-sm text-[var(--foreground)]"
                                            />
                                        ) : (
                                            `$${asset.avgCost.toFixed(2)}`
                                        )}
                                    </td>
                                    <td className={`py-4 font-semibold ${unrealizedPL >= 0 ? "text-green-500" : "text-red-400"}`}>
                                        {formatSignedNumber(unrealizedPL, "")}
                                    </td>
                                    <td className={`py-4 font-semibold ${dailyChangePct >= 0 ? "text-green-500" : "text-red-400"}`}>
                                        {formatSignedNumber(dailyChangePct, "%")}
                                    </td>
                                    <td className="py-4">${costBasis.toFixed(2)}</td>
                                    <td className="py-4">${marketValue.toFixed(2)}</td>
                                    <td className={`py-4 font-semibold ${unrealizedPL >= 0 ? "text-green-500" : "text-red-400"}`}>
                                        {formatSignedNumber(unrealizedPL, "")}
                                    </td>
                                    <td className={`py-4 font-semibold ${unrealizedPLPct >= 0 ? "text-green-500" : "text-red-400"}`}>
                                        {formatSignedNumber(unrealizedPLPct, "%")}
                                    </td>
                                    <td className={`py-4 font-semibold ${ytdChangePct >= 0 ? "text-green-500" : "text-red-400"}`}>
                                        {formatSignedNumber(ytdChangePct, "%")}
                                    </td>
                                    <td className="py-4 text-right">
                                        <div className="relative" data-asset-menu>
                                            <button
                                                type="button"
                                                className="rounded px-2 py-1 text-lg leading-none text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                                                onClick={() =>
                                                    setOpenMenuAssetId((prev) =>
                                                        prev === asset.id ? null : asset.id
                                                    )
                                                }
                                            >
                                                ⋯
                                            </button>
                                            {openMenuAssetId === asset.id && !isEditing && (
                                                <div className="absolute right-0 z-20 mt-2 w-32 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1 shadow-lg">
                                                    <button
                                                        type="button"
                                                        className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-[var(--surface)]"
                                                        onClick={() => startEditing(asset)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="block w-full rounded px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
                                                        onClick={() => confirmDelete(asset)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {editError && <p className="mt-3 text-sm text-red-400">{editError}</p>}
        </div>
    );
}