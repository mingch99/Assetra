import { useMemo, useState } from "react";
import type { Asset, AssetTab } from "@/types/asset";

type AssetTableProps = {
    assets: Asset[];
    activeTab: AssetTab;
    onTabChange: (tab: AssetTab) => void;
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

export default function AssetTable({ assets, activeTab, onTabChange }: AssetTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>("marketValue");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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
                    </tr>
                </thead>

                <tbody>
                    {sortedAssets.map((asset) => {
                        const costBasis =
                            asset.avgCost * asset.quantity;

                        const marketValue =
                            asset.currentPrice * asset.quantity;

                        const profitLoss =
                            marketValue - costBasis;

                        const returnRate =
                            (profitLoss / costBasis) * 100;

                        return (
                            <tr key={asset.symbol} className="border-b">
                                <td className="py-4">
                                    <div className="font-semibold">
                                        {asset.name}
                                    </div>

                                    <div className="text-sm text-gray-500">
                                        {asset.symbol}
                                    </div>
                                </td>

                                <td className="py-4">{asset.type}</td>

                                <td className="py-4">
                                    {asset.quantity}
                                </td>

                                <td className="py-4">
                                    ${asset.avgCost}
                                </td>

                                <td className="py-4">
                                    ${asset.currentPrice}
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
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}