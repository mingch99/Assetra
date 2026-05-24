import { useMemo, useState } from "react";
import type { Asset, AssetTab, AssetType } from "@/types/asset";

type AssetTableProps = {
    assets: Asset[];
    activeTab: AssetTab;
    onTabChange: (tab: AssetTab) => void;
    onDeleteAsset: (assetId: string) => void;
    onUpdateAsset: (asset: Asset) => void;
};

type SortKey = "name" | "marketValue" | "returnRate";
type SortDirection = "asc" | "desc";

const tabConfig: { key: AssetTab; label: string }[] = [
    { key: "All", label: "All" },
    { key: "Stock", label: "Stock" },
    { key: "Crypto", label: "Crypto" },
];

function getMarketValue(asset: Asset) {
    return asset.currentPrice * asset.quantity;
}

function getCostBasis(asset: Asset) {
    return asset.avgCost * asset.quantity;
}

function getReturnRate(asset: Asset) {
    const costBasis = getCostBasis(asset);
    if (costBasis === 0) return 0;
    return ((getMarketValue(asset) - costBasis) / costBasis) * 100;
}

type EditFormState = {
    name: string;
    symbol: string;
    type: AssetType;
    quantity: string;
    avgCost: string;
    currentPrice: string;
};

export default function AssetTable({
    assets,
    activeTab,
    onTabChange,
    onDeleteAsset,
    onUpdateAsset,
}: AssetTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>("marketValue");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
    const [editError, setEditError] = useState("");
    const [editForm, setEditForm] = useState<EditFormState>({
        name: "",
        symbol: "",
        type: "Stock",
        quantity: "",
        avgCost: "",
        currentPrice: "",
    });

    const sortedAssets = useMemo(() => {
        const clonedAssets = [...assets];

        clonedAssets.sort((a, b) => {
            const directionFactor = sortDirection === "asc" ? 1 : -1;

            if (sortKey === "name") {
                return a.name.localeCompare(b.name) * directionFactor;
            }

            if (sortKey === "marketValue") {
                return (getMarketValue(a) - getMarketValue(b)) * directionFactor;
            }

            return (getReturnRate(a) - getReturnRate(b)) * directionFactor;
        });

        return clonedAssets;
    }, [assets, sortDirection, sortKey]);

    function startEditing(asset: Asset) {
        setEditingAssetId(asset.id);
        setEditError("");
        setEditForm({
            name: asset.name,
            symbol: asset.symbol,
            type: asset.type,
            quantity: String(asset.quantity),
            avgCost: String(asset.avgCost),
            currentPrice: String(asset.currentPrice),
        });
    }

    function cancelEditing() {
        setEditingAssetId(null);
        setEditError("");
    }

    function saveEditing(assetId: string) {
        const quantity = Number(editForm.quantity);
        const avgCost = Number(editForm.avgCost);
        const currentPrice = Number(editForm.currentPrice);

        if (!editForm.name.trim() || !editForm.symbol.trim()) {
            setEditError("資產名稱與代號不可為空。");
            return;
        }

        if (Number.isNaN(quantity) || quantity <= 0) {
            setEditError("數量必須大於 0。");
            return;
        }

        if (Number.isNaN(avgCost) || avgCost < 0) {
            setEditError("平均成本不可小於 0。");
            return;
        }

        if (Number.isNaN(currentPrice) || currentPrice < 0) {
            setEditError("現價不可小於 0。");
            return;
        }

        onUpdateAsset({
            id: assetId,
            name: editForm.name.trim(),
            symbol: editForm.symbol.trim().toUpperCase(),
            type: editForm.type,
            quantity,
            avgCost,
            currentPrice,
        });

        cancelEditing();
    }

    return (
        <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">
                Asset Table
            </h2>

            <div className="flex flex-wrap gap-3 mb-4">
                {tabConfig.map((tab) => {
                    const isActive = activeTab === tab.key;

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onTabChange(tab.key)}
                            className={`rounded-lg border px-4 py-2 text-left transition ${isActive
                                ? "bg-black text-white border-black"
                                : "bg-white text-gray-900 border-gray-300"
                                }`}
                        >
                            <div className="font-semibold">{tab.label}</div>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
                <label className="text-sm text-gray-700">
                    Sort by
                    <select
                        className="ml-2 border rounded-lg px-2 py-1"
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value as SortKey)}
                    >
                        <option value="marketValue">Market Value</option>
                        <option value="returnRate">Return %</option>
                        <option value="name">Name</option>
                    </select>
                </label>

                <label className="text-sm text-gray-700">
                    Direction
                    <select
                        className="ml-2 border rounded-lg px-2 py-1"
                        value={sortDirection}
                        onChange={(e) => setSortDirection(e.target.value as SortDirection)}
                    >
                        <option value="desc">Desc</option>
                        <option value="asc">Asc</option>
                    </select>
                </label>
            </div>

            {sortedAssets.length === 0 && (
                <p className="text-gray-500 mb-4">
                    尚未有資產，請先新增一筆資料。
                </p>
            )}

            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b text-gray-500">
                        <th className="py-3">Asset</th>
                        <th className="py-3">Type</th>
                        <th className="py-3">Quantity</th>
                        <th className="py-3">Avg Cost</th>
                        <th className="py-3">Current Price</th>
                        <th className="py-3">Market Value</th>
                        <th className="py-3">P/L</th>
                        <th className="py-3">Return %</th>
                        <th className="py-3 text-right">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {sortedAssets.map((asset) => {
                        const isEditing = editingAssetId === asset.id;
                        const costBasis =
                            asset.avgCost * asset.quantity;

                        const marketValue =
                            asset.currentPrice * asset.quantity;

                        const profitLoss =
                            marketValue - costBasis;

                        const returnRate =
                            (profitLoss / costBasis) * 100;

                        return (
                            <tr key={asset.id} className="border-b">
                                <td className="py-4">
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <input
                                                className="w-full border rounded px-2 py-1 text-sm"
                                                value={editForm.name}
                                                onChange={(e) =>
                                                    setEditForm((prev) => ({
                                                        ...prev,
                                                        name: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                className="w-full border rounded px-2 py-1 text-sm"
                                                value={editForm.symbol}
                                                onChange={(e) =>
                                                    setEditForm((prev) => ({
                                                        ...prev,
                                                        symbol: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="font-semibold">
                                                {asset.name}
                                            </div>

                                            <div className="text-sm text-gray-500">
                                                {asset.symbol}
                                            </div>
                                        </>
                                    )}
                                </td>

                                <td className="py-4">
                                    {isEditing ? (
                                        <select
                                            className="border rounded px-2 py-1 text-sm"
                                            value={editForm.type}
                                            onChange={(e) =>
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    type: e.target.value as AssetType,
                                                }))
                                            }
                                        >
                                            <option value="Stock">Stock</option>
                                            <option value="Crypto">Crypto</option>
                                        </select>
                                    ) : (
                                        asset.type
                                    )}
                                </td>

                                <td className="py-4">
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            className="w-24 border rounded px-2 py-1 text-sm"
                                            value={editForm.quantity}
                                            onChange={(e) =>
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    quantity: e.target.value,
                                                }))
                                            }
                                        />
                                    ) : (
                                        asset.quantity
                                    )}
                                </td>

                                <td className="py-4">
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            className="w-24 border rounded px-2 py-1 text-sm"
                                            value={editForm.avgCost}
                                            onChange={(e) =>
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    avgCost: e.target.value,
                                                }))
                                            }
                                        />
                                    ) : (
                                        `$${asset.avgCost}`
                                    )}
                                </td>

                                <td className="py-4">
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            className="w-24 border rounded px-2 py-1 text-sm"
                                            value={editForm.currentPrice}
                                            onChange={(e) =>
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    currentPrice: e.target.value,
                                                }))
                                            }
                                        />
                                    ) : (
                                        `$${asset.currentPrice}`
                                    )}
                                </td>

                                <td className="py-4">
                                    ${marketValue.toFixed(2)}
                                </td>

                                <td
                                    className={`py-4 font-semibold ${profitLoss >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                        }`}
                                >
                                    ${profitLoss.toFixed(2)}
                                </td>

                                <td
                                    className={`py-4 font-semibold ${returnRate >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                        }`}
                                >
                                    {returnRate.toFixed(2)}%
                                </td>

                                <td className="py-4 text-right">
                                    {isEditing ? (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                className="rounded border border-gray-300 px-3 py-1 text-sm"
                                                onClick={cancelEditing}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded bg-black px-3 py-1 text-sm text-white"
                                                onClick={() => saveEditing(asset.id)}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                className="rounded border border-gray-300 px-3 py-1 text-sm"
                                                onClick={() => startEditing(asset)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded border border-red-300 px-3 py-1 text-sm text-red-600"
                                                onClick={() => onDeleteAsset(asset.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {editError && (
                <p className="mt-3 text-sm text-red-600">{editError}</p>
            )}
        </div>
    );
}