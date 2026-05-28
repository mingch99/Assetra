"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PortfolioCard from "@/components/PortfolioCard";
import AllocationChart from "@/components/AllocationChart";
import AssetTable from "@/components/AssetTable";
import type { Asset, NewAsset } from "@/types/asset";
import {
  createAsset,
  deleteAsset,
  fetchAssets,
  updateAsset,
} from "@/lib/api/assets";
import {
  fetchPortfolioState,
  savePortfolioState,
} from "@/lib/api/portfolio";
import { logout, me } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState(0);
  const [debtAmount, setDebtAmount] = useState(0);
  const [isPortfolioLoaded, setIsPortfolioLoaded] = useState(false);
  const didSavePortfolioRef = useRef(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const user = await me();
        setCurrentUser(user);
      } catch {
        router.replace("/");
      } finally {
        setIsAuthLoading(false);
      }
    }

    void loadSession();
  }, [router]);

  useEffect(() => {
    if (isAuthLoading || !currentUser) return;

    async function loadDashboardData() {
      try {
        setIsLoading(true);
        setError("");
        const [assetsData, portfolioData] = await Promise.all([
          fetchAssets(),
          fetchPortfolioState(),
        ]);
        setAssets(assetsData);
        setCashAmount(portfolioData.cashAmount);
        setDebtAmount(portfolioData.debtAmount);
        setIsPortfolioLoaded(true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load assets.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboardData();
  }, [currentUser, isAuthLoading]);

  useEffect(() => {
    if (!isPortfolioLoaded || isAuthLoading || !currentUser) return;

    // Skip the first autosave run immediately after loading data.
    if (!didSavePortfolioRef.current) {
      didSavePortfolioRef.current = true;
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        await savePortfolioState({ cashAmount, debtAmount });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save portfolio.";
        setError(message);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [cashAmount, currentUser, debtAmount, isAuthLoading, isPortfolioLoaded]);

  async function handleAddAsset(asset: NewAsset) {
    const normalizedSymbol = asset.symbol.trim().toUpperCase();
    if (
      assets.some(
        (existingAsset) => existingAsset.symbol.trim().toUpperCase() === normalizedSymbol
      )
    ) {
      const message = `標的 ${normalizedSymbol} 已存在，無法重複新增。`;
      setError(message);
      throw new Error(message);
    }

    try {
      const createdAsset = await createAsset(asset);
      setAssets((prevAssets) => [...prevAssets, createdAsset]);
      setError("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create asset.";
      setError(message);
      throw new Error(message);
    }
  }

  async function handleDeleteAsset(assetId: string) {
    const deletedAsset = assets.find((asset) => asset.id === assetId);
    setAssets((prevAssets) => prevAssets.filter((asset) => asset.id !== assetId));
    try {
      await deleteAsset(assetId);
      setError("");
    } catch (err) {
      if (deletedAsset) {
        setAssets((prevAssets) => [...prevAssets, deletedAsset]);
      }
      const message =
        err instanceof Error ? err.message : "Failed to delete asset.";
      setError(message);
      throw new Error(message);
    }
  }

  async function handleUpdateAsset(updatedAsset: Asset) {
    const previousAsset = assets.find((asset) => asset.id === updatedAsset.id);
    setAssets((prevAssets) =>
      prevAssets.map((asset) =>
        asset.id === updatedAsset.id ? updatedAsset : asset
      )
    );

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
      if (previousAsset) {
        setAssets((prevAssets) =>
          prevAssets.map((asset) =>
            asset.id === previousAsset.id ? previousAsset : asset
          )
        );
      }
      const message =
        err instanceof Error ? err.message : "Failed to update asset.";
      setError(message);
      throw new Error(message);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (isAuthLoading || !currentUser) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[var(--muted)]">
        Loading session...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <h1 className="text-4xl font-bold text-[var(--accent)]">Assetra Portfolio Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="h-11 w-11 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] font-semibold"
            >
              {currentUser.username.charAt(0).toUpperCase()}
            </button>
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg">
                <p className="text-sm text-[var(--muted)]">目前用戶</p>
                <p className="mt-1 font-semibold text-[var(--foreground)]">
                  {currentUser.username}
                </p>
                {currentUser.email && (
                  <p className="text-sm text-[var(--muted)]">{currentUser.email}</p>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-4 w-full rounded-lg border border-red-500/40 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10"
                >
                  登出
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--muted)] shadow-sm">
          Loading assets...
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <PortfolioCard
        assets={assets}
        cashAmount={cashAmount}
        debtAmount={debtAmount}
        onCashAmountChange={setCashAmount}
        onDebtAmountChange={setDebtAmount}
      />

      <AllocationChart allAssets={assets} cashAmount={cashAmount} />

      <AssetTable
        assets={assets}
        onDeleteAsset={handleDeleteAsset}
        onUpdateAsset={handleUpdateAsset}
        onAddAsset={handleAddAsset}
      />
    </main>
  );
}
