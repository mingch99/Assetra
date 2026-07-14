"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PortfolioCard from "@/components/PortfolioCard";
import AllocationChart from "@/components/AllocationChart";
import AssetTable from "@/components/AssetTable";
import UserMenu from "@/components/UserMenu";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { AgentChatWidget } from "@/ai-agent";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Asset, AssetGroup, NewAsset } from "@/types/asset";
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
import {
  createGroup,
  deleteGroup,
  fetchGroups,
  updateGroupName,
} from "@/lib/api/groups";
import { fetchQuotes } from "@/lib/api/quotes";
import type { QuoteMap } from "@/lib/api/quotes";
import { logout, me } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";

function applyQuotesToAssets(assets: Asset[], quotes: QuoteMap): Asset[] {
  return assets.map((asset) => {
    const live = quotes[asset.symbol.trim().toUpperCase()];
    return live ? { ...asset, currentPrice: live.price } : asset;
  });
}

export default function DashboardPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [groups, setGroups] = useState<AssetGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [cashAmount, setCashAmount] = useState(0);
  const [debtAmount, setDebtAmount] = useState(0);
  const [realEstateAmount, setRealEstateAmount] = useState(0);
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
        const [assetsData, portfolioData, groupsData, quotesData] =
          await Promise.all([
            fetchAssets(),
            fetchPortfolioState(),
            fetchGroups().catch(() => [] as AssetGroup[]),
            fetchQuotes().catch(() => ({} as QuoteMap)),
          ]);
        setAssets(assetsData);
        setGroups(groupsData);
        setCashAmount(portfolioData.cashAmount);
        setDebtAmount(portfolioData.debtAmount);
        setRealEstateAmount(portfolioData.realEstateAmount ?? 0);
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
      // Do not refresh the history chart on every quote poll — that caused layout jump.
    } catch (err) {
      if (!silent) {
        const message =
          err instanceof Error ? err.message : "Failed to refresh quotes.";
        setError(message);
      }
    } finally {
      if (!silent) setIsRefreshingQuotes(false);
    }
  }, []);

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
    () => applyQuotesToAssets(assets, quotes),
    [assets, quotes]
  );

  useEffect(() => {
    if (!isPortfolioLoaded || isAuthLoading || !currentUser) return;

    if (!didSavePortfolioRef.current) {
      didSavePortfolioRef.current = true;
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        await savePortfolioState({
          cashAmount,
          debtAmount,
          realEstateAmount,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save portfolio.";
        setError(message);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [
    cashAmount,
    currentUser,
    debtAmount,
    isAuthLoading,
    isPortfolioLoaded,
    realEstateAmount,
  ]);

  async function handleAddAsset(asset: NewAsset) {
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
    setAssets((prevAssets) =>
      prevAssets.filter((asset) => asset.id !== assetId)
    );
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
        groupId: updatedAsset.groupId ?? null,
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

  async function handleCreateGroup(name: string) {
    const group = await createGroup({ name });
    setGroups((prev) => [...prev, group]);
  }

  async function handleRenameGroup(groupId: string, name: string) {
    const updated = await updateGroupName(groupId, name);
    setGroups((prev) =>
      prev.map((group) => (group.id === groupId ? updated : group))
    );
    setAssets((prev) =>
      prev.map((asset) =>
        asset.groupId === groupId
          ? { ...asset, group: { id: updated.id, name: updated.name } }
          : asset
      )
    );
  }

  async function handleDeleteGroup(groupId: string) {
    await deleteGroup(groupId);
    setGroups((prev) => prev.filter((group) => group.id !== groupId));
    setAssets((prev) =>
      prev.map((asset) =>
        asset.groupId === groupId
          ? { ...asset, groupId: null, group: null }
          : asset
      )
    );
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (isAuthLoading || !currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--muted)]">
        {t("loadingSession")}
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[var(--background)] p-10 text-[var(--foreground)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h1 className="text-4xl font-bold text-[var(--accent)]">
            {t("dashboardTitle")}
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <button
                type="button"
                onClick={() => refreshQuotes()}
                disabled={isRefreshingQuotes}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-2)] disabled:opacity-60"
              >
                {isRefreshingQuotes ? t("refreshingQuotes") : t("refreshQuotes")}
              </button>
              {quotesUpdatedAt && (
                <span className="mt-1 text-xs text-[var(--muted)]">
                  {t("quotesUpdatedAt", {
                    time: quotesUpdatedAt.toLocaleTimeString(),
                  })}
                </span>
              )}
            </div>
            <LanguageSwitcher />
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
            {t("loadingAssets")}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <PortfolioCard
          assets={assetsWithPrices}
          quotes={quotes}
          cashAmount={cashAmount}
          debtAmount={debtAmount}
          realEstateAmount={realEstateAmount}
          onCashAmountChange={setCashAmount}
          onDebtAmountChange={setDebtAmount}
          onRealEstateAmountChange={setRealEstateAmount}
        />

        <AllocationChart
          allAssets={assetsWithPrices}
          groups={groups}
          cashAmount={cashAmount}
          realEstateAmount={realEstateAmount}
        />

        <AssetTable
          assets={assetsWithPrices}
          groups={groups}
          quotes={quotes}
          onDeleteAsset={handleDeleteAsset}
          onUpdateAsset={handleUpdateAsset}
          onAddAsset={handleAddAsset}
          onCreateGroup={handleCreateGroup}
          onRenameGroup={handleRenameGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      </main>

      <AgentChatWidget disabled={isLoading} />
    </>
  );
}
