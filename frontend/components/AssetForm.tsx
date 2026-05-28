"use client";

import { useMemo, useState } from "react";
import type { ComponentProps } from "react";
import type { AssetType, NewAsset } from "@/types/asset";

type AssetOption = {
    name: string;
    symbol: string;
    type: AssetType;
};

const assetOptions = [
    { name: "Apple", symbol: "AAPL", type: "Stock" as AssetType },
    { name: "Amazon", symbol: "AMZN", type: "Stock" as AssetType },
    { name: "Alphabet", symbol: "GOOG", type: "Stock" as AssetType },
    { name: "Meta Platforms", symbol: "META", type: "Stock" as AssetType },
    { name: "Palantir", symbol: "PLTR", type: "Stock" as AssetType },
    { name: "SoFi Technologies", symbol: "SOFI", type: "Stock" as AssetType },
    { name: "Taiwan Semiconductor", symbol: "TSM", type: "Stock" as AssetType },
    { name: "Vanguard S&P 500 ETF", symbol: "VOO", type: "Stock" as AssetType },
    { name: "Interactive Brokers", symbol: "IBKR", type: "Stock" as AssetType },
    { name: "Tesla", symbol: "TSLA", type: "Stock" as AssetType },
    { name: "Nvidia", symbol: "NVDA", type: "Stock" as AssetType },
    { name: "Microsoft", symbol: "MSFT", type: "Stock" as AssetType },
    { name: "Bitcoin", symbol: "BTC", type: "Crypto" as AssetType },
    { name: "Ethereum", symbol: "ETH", type: "Crypto" as AssetType },
    { name: "XRP", symbol: "XRP", type: "Crypto" as AssetType },
    { name: "BNB", symbol: "BNB", type: "Crypto" as AssetType },
    { name: "Solana", symbol: "SOL", type: "Crypto" as AssetType },
    { name: "Tether", symbol: "USDT", type: "Crypto" as AssetType },
];

type AssetFormProps = {
    onAddAsset: (asset: NewAsset) => Promise<void>;
    existingSymbols?: string[];
    className?: string;
};

type FormSubmitEvent = Parameters<
    NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

export default function AssetForm({
    onAddAsset,
    existingSymbols = [],
    className = "",
}: AssetFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        symbol: "",
        type: "Stock" as AssetType,
        quantity: "",
        avgCost: "",
    });

    const existingSymbolSet = useMemo(
        () => new Set(existingSymbols.map((symbol) => symbol.trim().toUpperCase())),
        [existingSymbols]
    );

    const filteredAssetOptions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return assetOptions.filter((asset) => {
            if (existingSymbolSet.has(asset.symbol.toUpperCase())) {
                return false;
            }
            if (!query) return true;
            return (
                asset.symbol.toLowerCase().includes(query) ||
                asset.name.toLowerCase().includes(query)
            );
        });
    }, [existingSymbolSet, searchQuery]);

    function handleSelectAsset(asset: AssetOption) {
        setFormData({
            ...formData,
            name: asset.name,
            symbol: asset.symbol,
            type: asset.type,
        });
        setSearchQuery(`${asset.symbol} - ${asset.name}`);
        setIsSearchOpen(false);
    }

    function handleSearchChange(value: string) {
        setSearchQuery(value);
        setIsSearchOpen(true);

        setFormData({
            ...formData,
            name: "",
            symbol: "",
        });
    }

    function handleSearchBlur() {
        setTimeout(() => {
            setIsSearchOpen(false);
        }, 120);
    }

    function resetForm() {
        setFormData({
            name: "",
            symbol: "",
            type: "Stock",
            quantity: "",
            avgCost: "",
        });
        setSearchQuery("");
        setIsSearchOpen(false);
    }

    async function handleSubmit(e: FormSubmitEvent) {
        e.preventDefault();
        setError("");

        const quantity = Number(formData.quantity);
        const avgCost = Number(formData.avgCost);
        if (!formData.name.trim() || !formData.symbol.trim()) {
            setError("請從下拉選單選擇正確的資產代號。");
            return;
        }

        if (Number.isNaN(quantity) || quantity <= 0) {
            setError("數量必須大於 0。");
            return;
        }

        if (Number.isNaN(avgCost) || avgCost < 0) {
            setError("平均成本不可小於 0。");
            return;
        }

        const normalizedSymbol = formData.symbol.trim().toUpperCase();
        if (existingSymbolSet.has(normalizedSymbol)) {
            setError("此標的已存在，無法重複新增。");
            return;
        }

        try {
            await onAddAsset({
                name: formData.name.trim(),
                symbol: normalizedSymbol,
                type: formData.type,
                quantity,
                avgCost,
                currentPrice: 0,
            });
            resetForm();
            setIsOpen(false);
        } catch (submitError) {
            const message =
                submitError instanceof Error
                    ? submitError.message
                    : "新增資產失敗，請稍後再試。";
            setError(message);
        }
    }

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-lg bg-[var(--accent)] px-5 py-3 font-semibold text-black hover:bg-[var(--accent-hover)] transition"
            >
                {isOpen ? "Close Form" : "Add New Asset"}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-[min(56rem,calc(100vw-3rem))] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-md p-6 z-20">
                    <h2 className="text-2xl font-semibold mb-4 text-[var(--accent)]">
                        Add New Asset
                    </h2>

                    <form
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        onSubmit={handleSubmit}
                    >
                        <div className="relative">
                            <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
                                Instrument
                            </label>
                            <input
                                type="text"
                                placeholder="Search symbol or company"
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                onFocus={() => setIsSearchOpen(true)}
                                onBlur={handleSearchBlur}
                                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
                            />
                            {isSearchOpen && filteredAssetOptions.length > 0 && (
                                <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg">
                                    {filteredAssetOptions.map((asset) => (
                                        <button
                                            key={asset.symbol}
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleSelectAsset(asset);
                                            }}
                                            className="w-full px-3 py-2 text-left hover:bg-[var(--surface-2)]"
                                        >
                                            <div className="font-semibold text-[var(--foreground)]">
                                                {asset.symbol}
                                            </div>
                                            <div className="text-sm text-[var(--muted)]">
                                                {asset.name}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
                                Position
                            </label>
                            <input
                                type="number"
                                placeholder="Enter position"
                                value={formData.quantity}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        quantity: e.target.value,
                                    })
                                }
                                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
                                Avg. Price
                            </label>
                            <input
                                type="number"
                                placeholder="Enter average price"
                                value={formData.avgCost}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        avgCost: e.target.value,
                                    })
                                }
                                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
                            />
                        </div>

                        <button
                            type="submit"
                            className="rounded-lg bg-[var(--accent)] p-3 font-semibold text-black hover:bg-[var(--accent-hover)] transition md:col-span-3"
                        >
                            Add Asset
                        </button>

                        {error && (
                            <p className="text-red-600 text-sm md:col-span-3">
                                {error}
                            </p>
                        )}
                    </form>
                </div>
            )}
        </div>
    );
}