"use client";

import { useEffect, useMemo, useState } from "react";
import AssetForm from "@/components/AssetForm";
import GroupManager from "@/components/GroupManager";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { EnMessages } from "@/lib/i18n/messages/en";
import type { Asset, AssetGroup, AssetTab, NewAsset } from "@/types/asset";
import type { QuoteMap } from "@/lib/api/quotes";

type AssetTableProps = {
  assets: Asset[];
  groups: AssetGroup[];
  quotes: QuoteMap;
  onDeleteAsset: (assetId: string) => Promise<void>;
  onUpdateAsset: (asset: Asset) => Promise<void>;
  onAddAsset: (asset: NewAsset) => Promise<void>;
  onCreateGroup: (name: string) => Promise<void>;
  onRenameGroup: (groupId: string, name: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
};

type SortDirection = "asc" | "desc";
type SortKey =
  | "instrument"
  | "group"
  | "position"
  | "avgPrice"
  | "currentPrice"
  | "pl"
  | "dailyChange"
  | "costBasis"
  | "marketValue"
  | "unrealizedPL"
  | "unrealizedPLPct";

type EditFormState = {
  quantity: string;
  avgCost: string;
};

const filterOptions: AssetTab[] = ["All", "Stock", "ETF", "Crypto"];

function getCostBasis(asset: Asset) {
  if (asset.type === "Crypto") return 0;
  return asset.quantity * asset.avgCost;
}

function getMarketValue(asset: Asset) {
  const effectivePrice =
    asset.currentPrice > 0 ? asset.currentPrice : asset.avgCost;
  return asset.quantity * effectivePrice;
}

function getUnrealizedPL(asset: Asset) {
  if (asset.type === "Crypto" || asset.avgCost <= 0) return null;
  return getMarketValue(asset) - getCostBasis(asset);
}

function getUnrealizedPLPct(asset: Asset) {
  const costBasis = getCostBasis(asset);
  const pnl = getUnrealizedPL(asset);
  if (pnl === null || costBasis === 0) return null;
  return (pnl / costBasis) * 100;
}

function formatSignedNumber(value: number, suffix = "") {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${Math.abs(value).toFixed(2)}${suffix}`;
}

function formatPosition(asset: Asset) {
  const decimals = asset.type === "Crypto" ? 8 : 4;
  return asset.quantity.toFixed(decimals);
}

function formatPrice(value: number) {
  if (Math.abs(value) >= 1000) {
    return `$${Math.round(value).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}`;
  }
  return `$${value.toFixed(2)}`;
}

function formatSignedMoney(value: number) {
  const sign = value >= 0 ? "+" : "-";
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return `${sign}$${Math.round(abs).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}`;
  }
  return `${sign}$${abs.toFixed(2)}`;
}

function getDailyChangePct(quotes: QuoteMap, symbol: string): number | null {
  const quote = quotes[symbol.trim().toUpperCase()];
  return quote && typeof quote.changePct === "number" ? quote.changePct : null;
}

function getDailyPL(asset: Asset, changePct: number | null): number | null {
  if (changePct === null || asset.currentPrice <= 0) return null;
  const prevClose = asset.currentPrice / (1 + changePct / 100);
  return asset.quantity * (asset.currentPrice - prevClose);
}

function getGroupLabel(
  asset: Asset,
  groups: AssetGroup[],
  ungroupedLabel: string
) {
  if (!asset.groupId) return ungroupedLabel;
  return (
    asset.group?.name ??
    groups.find((group) => group.id === asset.groupId)?.name ??
    ungroupedLabel
  );
}

function typeFilterLabel(
  option: AssetTab,
  t: (key: keyof EnMessages) => string
) {
  switch (option) {
    case "All":
      return t("all");
    case "Stock":
      return t("stock");
    case "ETF":
      return t("etf");
    case "Crypto":
      return t("crypto");
  }
}

export default function AssetTable({
  assets,
  groups,
  quotes,
  onDeleteAsset,
  onUpdateAsset,
  onAddAsset,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
}: AssetTableProps) {
  const { t } = useI18n();
  const ungroupedLabel = t("ungrouped");
  const [filterTab, setFilterTab] = useState<AssetTab>("All");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("marketValue");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [openMenuAssetId, setOpenMenuAssetId] = useState<string | null>(null);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState<EditFormState>({
    quantity: "",
    avgCost: "",
  });

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (filterTab !== "All" && asset.type !== filterTab) return false;
      if (groupFilter === "all") return true;
      if (groupFilter === "ungrouped") return !asset.groupId;
      return asset.groupId === groupFilter;
    });
  }, [assets, filterTab, groupFilter]);

  const sortedAssets = useMemo(() => {
    const clonedAssets = [...filteredAssets];

    function getSortValue(asset: Asset) {
      switch (sortKey) {
        case "instrument":
          return asset.symbol;
        case "group":
          return getGroupLabel(asset, groups, ungroupedLabel);
        case "position":
          return asset.quantity;
        case "avgPrice":
          return asset.avgCost;
        case "currentPrice":
          return asset.currentPrice;
        case "pl":
          return (
            getDailyPL(asset, getDailyChangePct(quotes, asset.symbol)) ?? 0
          );
        case "dailyChange":
          return getDailyChangePct(quotes, asset.symbol) ?? 0;
        case "costBasis":
          return getCostBasis(asset);
        case "marketValue":
          return getMarketValue(asset);
        case "unrealizedPL":
          return getUnrealizedPL(asset) ?? 0;
        case "unrealizedPLPct":
          return getUnrealizedPLPct(asset) ?? 0;
        default:
          return 0;
      }
    }

    clonedAssets.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      const valueA = getSortValue(a);
      const valueB = getSortValue(b);

      if (typeof valueA === "string" && typeof valueB === "string") {
        return valueA.localeCompare(valueB) * direction;
      }
      return ((valueA as number) - (valueB as number)) * direction;
    });

    return clonedAssets;
  }, [
    filteredAssets,
    groups,
    quotes,
    sortDirection,
    sortKey,
    ungroupedLabel,
  ]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.closest("[data-asset-menu]")) return;
      setOpenMenuAssetId(null);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function toggleSort(nextSortKey: SortKey) {
    if (sortKey === nextSortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextSortKey);
    setSortDirection("desc");
  }

  function startEditing(asset: Asset) {
    setEditingAssetId(asset.id);
    setOpenMenuAssetId(null);
    setEditError("");
    setEditForm({
      quantity: String(asset.quantity),
      avgCost: String(asset.avgCost),
    });
  }

  function cancelEditing() {
    setEditingAssetId(null);
    setEditError("");
  }

  async function saveEditing(asset: Asset) {
    const quantity = Number(editForm.quantity);
    const isCrypto = asset.type === "Crypto";
    const avgCost = isCrypto ? 0 : Number(editForm.avgCost);

    if (Number.isNaN(quantity) || quantity <= 0) {
      setEditError(t("positionMustBePositive"));
      return;
    }

    if (!isCrypto && (Number.isNaN(avgCost) || avgCost < 0)) {
      setEditError(t("avgPriceCannotBeNegative"));
      return;
    }

    try {
      await onUpdateAsset({
        ...asset,
        quantity,
        avgCost,
      });
      cancelEditing();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("updateAssetFailed");
      setEditError(message);
    }
  }

  async function changeGroup(asset: Asset, groupId: string) {
    const nextGroupId = groupId === "" ? null : groupId;
    const nextGroup =
      nextGroupId === null
        ? null
        : groups.find((group) => group.id === nextGroupId) ?? null;

    try {
      await onUpdateAsset({
        ...asset,
        groupId: nextGroupId,
        group: nextGroup,
      });
      setEditError("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("updateGroupFailed");
      setEditError(message);
    }
  }

  async function confirmDelete(asset: Asset) {
    setOpenMenuAssetId(null);
    const confirmed = window.confirm(
      t("deleteAssetConfirm", { symbol: asset.symbol, name: asset.name })
    );
    if (confirmed) {
      try {
        await onDeleteAsset(asset.id);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("deleteAssetFailed");
        setEditError(message);
      }
    }
  }

  function renderSortHeader(label: string, sortTarget: SortKey) {
    const isActive = sortKey === sortTarget;
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-[var(--foreground)]"
        onClick={() => toggleSort(sortTarget)}
      >
        <span>{label}</span>
        <span className="text-xs">
          {isActive ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-[var(--accent)]">
          {t("assetTableTitle")}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--muted)]">
            <span>{t("type")}</span>
            <select
              className="rounded bg-transparent text-[var(--foreground)] outline-none"
              value={filterTab}
              onChange={(e) => setFilterTab(e.target.value as AssetTab)}
            >
              {filterOptions.map((option) => (
                <option key={option} value={option} className="text-black">
                  {typeFilterLabel(option, t)}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--muted)]">
            <span>{t("group")}</span>
            <select
              className="rounded bg-transparent text-[var(--foreground)] outline-none"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="all" className="text-black">
                {t("all")}
              </option>
              <option value="ungrouped" className="text-black">
                {ungroupedLabel}
              </option>
              {groups.map((group) => (
                <option key={group.id} value={group.id} className="text-black">
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <GroupManager
            groups={groups}
            onCreateGroup={onCreateGroup}
            onRenameGroup={onRenameGroup}
            onDeleteGroup={onDeleteGroup}
          />
          <AssetForm onAddAsset={onAddAsset} />
        </div>
      </div>

      {sortedAssets.length === 0 && (
        <p className="mb-4 text-[var(--muted)]">{t("noAssetsMatchFilter")}</p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-[1750px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)]">
              <th className="py-3">{t("type")}</th>
              <th className="py-3">
                {renderSortHeader(t("instrument"), "instrument")}
              </th>
              <th className="py-3">
                {renderSortHeader(t("group"), "group")}
              </th>
              <th className="py-3">
                {renderSortHeader(t("position"), "position")}
              </th>
              <th className="py-3">
                {renderSortHeader(t("last"), "currentPrice")}
              </th>
              <th className="py-3">
                {renderSortHeader(t("avgPrice"), "avgPrice")}
              </th>
              <th className="py-3">
                {renderSortHeader(t("dailyPnl"), "pl")}
              </th>
              <th className="py-3">
                {renderSortHeader(t("dailyPct"), "dailyChange")}
              </th>
              <th className="py-3">
                {renderSortHeader(t("costBasis"), "costBasis")}
              </th>
              <th className="py-3">
                {renderSortHeader(t("marketValue"), "marketValue")}
              </th>
              <th className="py-3">
                {renderSortHeader(t("unrealizedPnl"), "unrealizedPL")}
              </th>
              <th className="py-3">
                {renderSortHeader(t("unrealizedPnlPct"), "unrealizedPLPct")}
              </th>
              <th className="w-12 py-3" />
            </tr>
          </thead>
          <tbody>
            {sortedAssets.map((asset) => {
              const isEditing = editingAssetId === asset.id;
              const costBasis = getCostBasis(asset);
              const marketValue = getMarketValue(asset);
              const unrealizedPL = getUnrealizedPL(asset);
              const unrealizedPLPct = getUnrealizedPLPct(asset);
              const dailyChangePct = getDailyChangePct(quotes, asset.symbol);
              const dailyPL = getDailyPL(asset, dailyChangePct);

              return (
                <tr key={asset.id} className="border-b border-[var(--border)]">
                  <td className="py-4">{asset.type}</td>
                  <td className="py-4">
                    <div className="font-semibold">{asset.symbol}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {asset.name}
                    </div>
                    {isEditing && (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="rounded border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                        >
                          {t("cancel")}
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEditing(asset)}
                          className="rounded bg-[var(--accent)] px-3 py-1 text-xs font-medium text-black hover:bg-[var(--accent-hover)]"
                        >
                          {t("save")}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-4">
                    <select
                      className="max-w-[10rem] rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-sm text-[var(--foreground)]"
                      value={asset.groupId ?? ""}
                      onChange={(e) => void changeGroup(asset, e.target.value)}
                    >
                      <option value="">{ungroupedLabel}</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-4">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.quantity}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            quantity: e.target.value,
                          }))
                        }
                        className="w-24 rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-sm text-[var(--foreground)]"
                      />
                    ) : (
                      formatPosition(asset)
                    )}
                  </td>
                  <td className="py-4">
                    {asset.currentPrice > 0
                      ? formatPrice(asset.currentPrice)
                      : "—"}
                  </td>
                  <td className="py-4">
                    {asset.type === "Crypto" ? (
                      <span className="text-[var(--muted)]">—</span>
                    ) : isEditing ? (
                      <input
                        type="number"
                        value={editForm.avgCost}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            avgCost: e.target.value,
                          }))
                        }
                        className="w-24 rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-sm text-[var(--foreground)]"
                      />
                    ) : (
                      formatPrice(asset.avgCost)
                    )}
                  </td>
                  <td className="py-4 font-semibold">
                    {dailyPL === null ? (
                      <span className="text-[var(--muted)]">—</span>
                    ) : (
                      <span
                        className={
                          dailyPL >= 0 ? "text-green-500" : "text-red-400"
                        }
                      >
                        {formatSignedMoney(dailyPL)}
                      </span>
                    )}
                  </td>
                  <td className="py-4 font-semibold">
                    {dailyChangePct === null ? (
                      <span className="text-[var(--muted)]">—</span>
                    ) : (
                      <span
                        className={
                          dailyChangePct >= 0
                            ? "text-green-500"
                            : "text-red-400"
                        }
                      >
                        {formatSignedNumber(dailyChangePct, "%")}
                      </span>
                    )}
                  </td>
                  <td className="py-4">
                    {asset.type === "Crypto" ? (
                      <span className="text-[var(--muted)]">—</span>
                    ) : (
                      formatPrice(costBasis)
                    )}
                  </td>
                  <td className="py-4">{formatPrice(marketValue)}</td>
                  <td className="py-4 font-semibold">
                    {unrealizedPL === null ? (
                      <span className="text-[var(--muted)]">—</span>
                    ) : (
                      <span
                        className={
                          unrealizedPL >= 0 ? "text-green-500" : "text-red-400"
                        }
                      >
                        {formatSignedMoney(unrealizedPL)}
                      </span>
                    )}
                  </td>
                  <td className="py-4 font-semibold">
                    {unrealizedPLPct === null ? (
                      <span className="text-[var(--muted)]">—</span>
                    ) : (
                      <span
                        className={
                          unrealizedPLPct >= 0
                            ? "text-green-500"
                            : "text-red-400"
                        }
                      >
                        {formatSignedNumber(unrealizedPLPct, "%")}
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <div className="relative" data-asset-menu>
                      <button
                        type="button"
                        className="rounded px-2 py-1 text-lg leading-none text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                        onClick={() =>
                          setOpenMenuAssetId((prev) =>
                            prev === asset.id ? null : asset.id
                          )
                        }
                      >
                        ⋯
                      </button>
                      {openMenuAssetId === asset.id && !isEditing && (
                        <div className="absolute right-0 z-20 mt-2 w-32 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1 shadow-lg">
                          <button
                            type="button"
                            className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-[var(--surface)]"
                            onClick={() => startEditing(asset)}
                          >
                            {t("edit")}
                          </button>
                          <button
                            type="button"
                            className="block w-full rounded px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
                            onClick={() => confirmDelete(asset)}
                          >
                            {t("delete")}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editError && <p className="mt-3 text-sm text-red-400">{editError}</p>}
    </div>
  );
}
