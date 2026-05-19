"use client";

import { useMemo, useState } from "react";
import PortfolioCard from "@/components/PortfolioCard";
import AllocationChart from "@/components/AllocationChart";
import AssetForm from "@/components/AssetForm";
import AssetTable from "@/components/AssetTable";
import type { Asset, AssetTab } from "@/types/asset";

const initialAssets: Asset[] = [
  {
    name: "Apple",
    symbol: "AAPL",
    type: "Stock",
    quantity: 10,
    avgCost: 180,
    currentPrice: 195,
  },
  {
    name: "Bitcoin",
    symbol: "BTC",
    type: "Crypto",
    quantity: 0.2,
    avgCost: 60000,
    currentPrice: 67000,
  },
  {
    name: "Tesla",
    symbol: "TSLA",
    type: "Stock",
    quantity: 5,
    avgCost: 220,
    currentPrice: 210,
  },
];

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [activeTab, setActiveTab] = useState<AssetTab>("All");

  function handleAddAsset(asset: Asset) {
    setAssets((prevAssets) => [...prevAssets, asset]);
  }

  const filteredAssets = useMemo(() => {
    if (activeTab === "All") return assets;
    return assets.filter((asset) => asset.type === activeTab);
  }, [assets, activeTab]);

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <h1 className="text-4xl font-bold">
          Assetra Portfolio Dashboard
        </h1>
        <AssetForm onAddAsset={handleAddAsset} className="mb-0" />
      </div>

      <PortfolioCard assets={filteredAssets} />

      <AllocationChart allAssets={assets} activeTab={activeTab} />

      <AssetTable
        assets={filteredAssets}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </main>
  );
}