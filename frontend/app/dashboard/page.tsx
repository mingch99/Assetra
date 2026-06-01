"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PortfolioCard from "@/components/PortfolioCard";
import AllocationChart from "@/components/AllocationChart";
import AssetTable from "@/components/AssetTable";
import UserMenu from "@/components/UserMenu";
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
import { fetchQuotes } from "@/lib/api/quotes";
import type { QuoteMap } from "@/lib/api/quotes";
import { logout, me } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [cashAmount, setCashAmount] = useState(0);
  const [debtAmount, setDebtAmount] = useState(0);
  const [isPortfolioLoaded, setIsPortfolioLoaded] = useState(false);
  const didSavePortfolioRef = useRef(false);
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState(false);
  const [quotesUpdatedAt, setQuotesUpdatedAt] = useState<Date | null>(null);

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
        const [assetsData, portfolioData, quotesData] = await Promise.all([
          fetchAssets(),
          fetchPortfolioState(),
          fetchQuotes().catch(() => ({} as QuoteMap)),
        ]);
        setAssets(assetsData);
        setCashAmount(portfolioData.cashAmount);
        setDebtAmount(portfolioData.debtAmount);
        setQuotes(quotesData);
        setQuotesUpdatedAt(new Date());
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

  const refreshQuotes = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) setIsRefreshingQuotes(true);
    try {
      const quotesData = await fetchQuotes();
      setQuotes(quotesData);
      setQuotesUpdatedAt(new Date());
    } catch (err) {
      // 自動（背景）更新失敗時不打擾使用者，僅手動更新才顯示錯誤。
      if (!silent) {
        const message =
          err instanceof Error ? err.message : "更新報價失敗，請稍後再試。";
        setError(message);
      }
    } finally {
      if (!silent) setIsRefreshingQuotes(false);
    }
  }, []);

  // 每 60 秒自動更新報價；分頁切到背景時暫停以節省 API 額度。
  useEffect(() => {
    if (!isPortfolioLoaded) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshQuotes({ silent: true });
      }
    }, 60000);

    return () => window.clearInterval(timer);
  }, [isPortfolioLoaded, refreshQuotes]);

  const assetsWithPrices = useMemo(
    () =>
      assets.map((asset) => {
        const live = quotes[asset.symbol.trim().toUpperCase()];
        return live ? { ...asset, currentPrice: live.price } : asset;
      }),
    [assets, quotes]
  );

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
          <div className="flex flex-col items-end">
            <button
              type="button"
              onClick={() => refreshQuotes()}
              disabled={isRefreshingQuotes}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-2)] transition disabled:opacity-60"
            >
              {isRefreshingQuotes ? "更新中..." : "更新報價"}
            </button>
            {quotesUpdatedAt && (
              <span className="mt-1 text-xs text-[var(--muted)]">
                報價更新於 {quotesUpdatedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
          <UserMenu
            user={currentUser}
            onUserUpdate={setCurrentUser}
            onLogout={handleLogout}
            onAccountDeleted={() => router.replace("/")}
          />
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
        assets={assetsWithPrices}
        cashAmount={cashAmount}
        debtAmount={debtAmount}
        onCashAmountChange={setCashAmount}
        onDebtAmountChange={setDebtAmount}
      />

      <AllocationChart allAssets={assetsWithPrices} cashAmount={cashAmount} />

      <AssetTable
        assets={assetsWithPrices}
        quotes={quotes}
        onDeleteAsset={handleDeleteAsset}
        onUpdateAsset={handleUpdateAsset}
        onAddAsset={handleAddAsset}
      />
    </main>
  );
}
