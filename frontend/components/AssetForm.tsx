"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import type { Asset, AssetType } from "@/types/asset";

const assetOptions = [
    { name: "Apple", symbol: "AAPL", type: "Stock" as AssetType },
    { name: "Tesla", symbol: "TSLA", type: "Stock" as AssetType },
    { name: "Nvidia", symbol: "NVDA", type: "Stock" as AssetType },
    { name: "Microsoft", symbol: "MSFT", type: "Stock" as AssetType },
    { name: "Bitcoin", symbol: "BTC", type: "Crypto" as AssetType },
    { name: "Ethereum", symbol: "ETH", type: "Crypto" as AssetType },
];

type AssetFormProps = {
    onAddAsset: (asset: Asset) => void;
    className?: string;
};

type FormSubmitEvent = Parameters<
    NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

export default function AssetForm({ onAddAsset, className = "" }: AssetFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        symbol: "",
        type: "Stock" as AssetType,
        quantity: "",
        avgCost: "",
        currentPrice: "",
    });

    function handleAssetSearch(value: string) {
        const matchedAsset = assetOptions.find(
            (asset) =>
                asset.symbol.toLowerCase() === value.toLowerCase() ||
                asset.name.toLowerCase() === value.toLowerCase()
        );

        if (matchedAsset) {
            setFormData({
                ...formData,
                name: matchedAsset.name,
                symbol: matchedAsset.symbol,
                type: matchedAsset.type,
            });
        } else {
            setFormData({
                ...formData,
                name: value,
                symbol: value.toUpperCase(),
            });
        }
    }

    function resetForm() {
        setFormData({
            name: "",
            symbol: "",
            type: "Stock",
            quantity: "",
            avgCost: "",
            currentPrice: "",
        });
    }

    function handleSubmit(e: FormSubmitEvent) {
        e.preventDefault();
        setError("");

        const quantity = Number(formData.quantity);
        const avgCost = Number(formData.avgCost);
        const currentPrice = Number(formData.currentPrice);

        if (!formData.name.trim() || !formData.symbol.trim()) {
            setError("請輸入資產名稱與代號。");
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

        if (Number.isNaN(currentPrice) || currentPrice < 0) {
            setError("現價不可小於 0。");
            return;
        }

        onAddAsset({
            name: formData.name.trim(),
            symbol: formData.symbol.trim().toUpperCase(),
            type: formData.type,
            quantity,
            avgCost,
            currentPrice,
        });

        resetForm();
        setIsOpen(false);
    }

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-black text-white rounded-lg px-5 py-3 font-semibold"
            >
                {isOpen ? "Close Form" : "Add New Asset"}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-[min(56rem,calc(100vw-3rem))] bg-white rounded-2xl shadow-md p-6 z-20">
                    <h2 className="text-2xl font-semibold mb-4">
                        Add New Asset
                    </h2>

                    <form
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        onSubmit={handleSubmit}
                    >
                        <input
                            type="text"
                            placeholder="Search by Symbol or Asset Name"
                            value={formData.symbol}
                            onChange={(e) => handleAssetSearch(e.target.value)}
                            className="border rounded-lg p-3"
                        />

                        <input
                            type="text"
                            placeholder="Asset Name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            className="border rounded-lg p-3"
                        />

                        <select
                            value={formData.type}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    type: e.target.value as AssetType,
                                })
                            }
                            className="border rounded-lg p-3"
                        >
                            <option value="Stock">Stock</option>
                            <option value="Crypto">Crypto</option>
                        </select>

                        <input
                            type="number"
                            placeholder="Quantity"
                            value={formData.quantity}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    quantity: e.target.value,
                                })
                            }
                            className="border rounded-lg p-3"
                        />

                        <input
                            type="number"
                            placeholder="Avg Cost"
                            value={formData.avgCost}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    avgCost: e.target.value,
                                })
                            }
                            className="border rounded-lg p-3"
                        />

                        <input
                            type="number"
                            placeholder="Current Price"
                            value={formData.currentPrice}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    currentPrice: e.target.value,
                                })
                            }
                            className="border rounded-lg p-3"
                        />

                        <button
                            type="submit"
                            className="bg-black text-white rounded-lg p-3 font-semibold md:col-span-3"
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