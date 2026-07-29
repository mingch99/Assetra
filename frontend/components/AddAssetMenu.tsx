"use client";

import { useEffect, useRef, useState } from "react";
import AssetForm from "@/components/AssetForm";
import BrokerImportControls from "@/components/BrokerImportControls";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { NewAsset } from "@/types/asset";

type AddAssetMenuProps = {
  onAddAsset: (asset: NewAsset) => Promise<void>;
  importDisabled?: boolean;
  onImported?: () => Promise<void> | void;
};

export default function AddAssetMenu({
  onAddAsset,
  importDisabled = false,
  onImported,
}: AddAssetMenuProps) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [importRequestId, setImportRequestId] = useState(0);

  useEffect(() => {
    if (!menuOpen && !formOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setMenuOpen(false);
        setFormOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen, formOpen]);

  function openAddForm() {
    setMenuOpen(false);
    setFormOpen(true);
  }

  function startBankImport() {
    setMenuOpen(false);
    setFormOpen(false);
    setImportRequestId((prev) => prev + 1);
  }

  return (
    <div ref={rootRef} className="relative flex flex-wrap items-start gap-3">
      <button
        type="button"
        aria-label={t("addAssetMenu")}
        aria-expanded={menuOpen}
        onClick={() => {
          if (formOpen) {
            setFormOpen(false);
            setMenuOpen(false);
            return;
          }
          setMenuOpen((prev) => !prev);
        }}
        className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent)] text-2xl font-semibold leading-none text-black transition hover:bg-[var(--accent-hover)]"
      >
        {menuOpen || formOpen ? "×" : "+"}
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-14 z-30 w-56 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
          <button
            type="button"
            onClick={openAddForm}
            className="block w-full px-4 py-3 text-left text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-2)] hover:text-[var(--accent)]"
          >
            {t("addNewAsset")}
          </button>
          {onImported && (
            <button
              type="button"
              disabled={importDisabled}
              onClick={startBankImport}
              className="block w-full border-t border-[var(--border)] px-4 py-3 text-left text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-2)] hover:text-[var(--accent)] disabled:opacity-50"
            >
              {t("brokerImportCta")}
            </button>
          )}
        </div>
      )}

      {formOpen && (
        <div className="absolute right-0 top-14 z-20">
          <AssetForm
            onAddAsset={onAddAsset}
            showTrigger={false}
            open={formOpen}
            onOpenChange={setFormOpen}
          />
        </div>
      )}

      {onImported && (
        <BrokerImportControls
          disabled={importDisabled}
          onImported={onImported}
          showTrigger={false}
          importRequestId={importRequestId}
        />
      )}
    </div>
  );
}
