"use client";

import { useState } from "react";

const assetOptions = [
    { name: "Apple", symbol: "AAPL", type: "Stock" },
    { name: "Tesla", symbol: "TSLA", type: "Stock" },
    { name: "Nvidia", symbol: "NVDA", type: "Stock" },
    { name: "Microsoft", symbol: "MSFT", type: "Stock" },
    { name: "Bitcoin", symbol: "BTC", type: "Crypto" },
    { name: "Ethereum", symbol: "ETH", type: "Crypto" },
];

export default function AssetForm() {
    const [isOpen, setIsOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        symbol: "",
        type: "Stock",
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

    return (
        <div className="mb-8">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-black text-white rounded-lg px-5 py-3 font-semibold mb-4"
            >
                {isOpen ? "Close Form" : "Add New Asset"}
            </button>

            {isOpen && (
                <div className="bg-white rounded-2xl shadow-md p-6">
                    <h2 className="text-2xl font-semibold mb-4">
                        Add New Asset
                    </h2>

                    <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    type: e.target.value,
                                })
                            }
                            className="border rounded-lg p-3"
                        >
                            <option>Stock</option>
                            <option>Crypto</option>
                            <option>ETF</option>
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
                    </form>
                </div>
            )}
        </div>
    );
}