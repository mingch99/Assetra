"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";
import type { AssetType, NewAsset } from "@/types/asset";
import { searchSymbols } from "@/lib/api/symbols";
import type { SymbolSearchResult } from "@/lib/api/symbols";
import { useI18n } from "@/lib/i18n/LanguageProvider";

type AssetFormProps = {
  onAddAsset: (asset: NewAsset) => Promise<void>;
  className?: string;
};

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

export default function AssetForm({
  onAddAsset,
  className = "",
}: AssetFormProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SymbolSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    type: "Stock" as AssetType,
    quantity: "",
    avgCost: "",
  });

  // 表單打開時自動聚焦搜尋框，會觸發 onFocus 把下拉選單展開。
  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  // 依關鍵字向 API 查詢對應標的（debounce 300ms）。
  useEffect(() => {
    // 已選定標的時不再搜尋。
    if (formData.symbol) return;

    const query = searchQuery.trim();
    const handle = window.setTimeout(async () => {
      if (query.length < 1) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await searchSymbols(query);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchQuery, formData.symbol]);

  const visibleResults = searchResults;

  function handleSelectAsset(asset: SymbolSearchResult) {
    setFormData({
      ...formData,
      name: asset.name,
      symbol: asset.symbol,
      type: asset.type,
    });
    setSearchQuery(`${asset.symbol} - ${asset.name}`);
    setSearchResults([]);
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
    const isCrypto = formData.type === "Crypto";
    const avgCost = isCrypto ? 0 : Number(formData.avgCost);
    if (!formData.name.trim() || !formData.symbol.trim()) {
      setError(t("selectInstrument"));
      return;
    }

    if (Number.isNaN(quantity) || quantity <= 0) {
      setError(t("positionMustBePositive"));
      return;
    }

    if (!isCrypto && (Number.isNaN(avgCost) || avgCost < 0)) {
      setError(t("avgPriceCannotBeNegative"));
      return;
    }

    const normalizedSymbol = formData.symbol.trim().toUpperCase();

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
          : t("addAssetFailed");
      setError(message);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg bg-[var(--accent)] px-5 py-3 font-semibold text-black hover:bg-[var(--accent-hover)] transition"
      >
        {isOpen ? t("closeForm") : t("addNewAsset")}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[min(56rem,calc(100vw-3rem))] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-md p-6 z-20">
          <h2 className="text-2xl font-semibold mb-4 text-[var(--accent)]">
            {t("addNewAsset")}
          </h2>

          <form
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            onSubmit={handleSubmit}
          >
            <div className="relative">
              <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
                {t("instrument")}
              </label>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t("searchInstruments")}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                  onClick={() => setIsSearchOpen(true)}
                  onBlur={handleSearchBlur}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 pr-9 text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                  ▾
                </span>
              </div>
              {isSearchOpen && (
                <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg">
                  {isSearching ? (
                    <div className="px-3 py-2 text-sm text-[var(--muted)]">
                      {t("searching")}
                    </div>
                  ) : visibleResults.length > 0 ? (
                    visibleResults.map((asset) => (
                      <button
                        key={`${asset.type}-${asset.symbol}`}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectAsset(asset);
                        }}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[var(--surface-2)]"
                      >
                        <span>
                          <span className="font-semibold text-[var(--foreground)]">
                            {asset.symbol}
                          </span>
                          <span className="ml-2 text-sm text-[var(--muted)]">
                            {asset.name}
                          </span>
                        </span>
                        <span className="shrink-0 rounded border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted)]">
                          {asset.type}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-[var(--muted)]">
                      {searchQuery.trim()
                        ? t("searchNotFound")
                        : t("searchInstruments")}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
                {t("position")}
              </label>
              <input
                type="number"
                placeholder={t("enterPosition")}
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

            {formData.type !== "Crypto" ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
                  {t("avgPrice")}
                </label>
                <input
                  type="number"
                  placeholder={t("enterAvgPrice")}
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
            ) : (
              <div className="flex items-end">
                <p className="pb-3 text-sm text-[var(--muted)]">
                  {t("cryptoQuantityOnly")}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] p-3 font-semibold text-black hover:bg-[var(--accent-hover)] transition md:col-span-3"
            >
              {t("addAsset")}
            </button>

            {error && (
              <p className="text-red-600 text-sm md:col-span-3">{error}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
