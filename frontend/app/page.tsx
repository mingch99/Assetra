"use client";

import { useEffect, useMemo, useState } from "react";
import PortfolioCard from "@/components/PortfolioCard";
import AllocationChart from "@/components/AllocationChart";
import AssetForm from "@/components/AssetForm";
import AssetTable from "@/components/AssetTable";
import type { Asset, AssetTab, NewAsset } from "@/types/asset";
import {
  createAsset,
  deleteAsset,
  fetchAssets,
  updateAsset,
} from "@/lib/api/assets";

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeTab, setActiveTab] = useState<AssetTab>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAssets() {
      try {
        setIsLoading(true);
        setError("");
        const data = await fetchAssets();
        setAssets(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load assets.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadAssets();
  }, []);

  async function handleAddAsset(asset: NewAsset) {
    try {
      const createdAsset = await createAsset(asset);
      setAssets((prevAssets) => [...prevAssets, createdAsset]);
      setError("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create asset.";
      setError(message);
    }
  }

  async function handleDeleteAsset(assetId: string) {
    try {
      await deleteAsset(assetId);
      setAssets((prevAssets) =>
        prevAssets.filter((asset) => asset.id !== assetId)
      );
      setError("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete asset.";
      setError(message);
    }
  }

  async function handleUpdateAsset(updatedAsset: Asset) {
    try {
      const payload: NewAsset = {
        name: updatedAsset.name,
        symbol: updatedAsset.symbol,
        type: updatedAsset.type,
        quantity: updatedAsset.quantity,
        avgCost: updatedAsset.avgCost,
        currentPrice: updatedAsset.currentPrice,
      };

      const savedAsset = await updateAsset(updatedAsset.id, payload);
      setAssets((prevAssets) =>
        prevAssets.map((asset) =>
          asset.id === savedAsset.id ? savedAsset : asset
        )
      );
      setError("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update asset.";
      setError(message);
    }
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

      {isLoading && (
        <div className="mb-6 rounded-lg bg-white p-4 text-gray-600 shadow-sm">
          Loading assets...
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <PortfolioCard assets={filteredAssets} />

      <AllocationChart allAssets={assets} activeTab={activeTab} />

      <AssetTable
        assets={filteredAssets}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onDeleteAsset={handleDeleteAsset}
        onUpdateAsset={handleUpdateAsset}
      />
    </main>
  );
}