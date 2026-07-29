"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import {
  createBrokerLinkToken,
  disconnectBrokerConnection,
  exchangeBrokerPublicToken,
  fetchBrokerConnections,
  syncBrokerConnections,
} from "@/lib/api/broker";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { BrokerConnectionSummary } from "@/types/asset";

type BrokerImportControlsProps = {
  disabled?: boolean;
  onImported: () => Promise<void> | void;
  showTrigger?: boolean;
  /** Increment to programmatically start the Plaid import flow. */
  importRequestId?: number;
};

type PlaidLauncherProps = {
  linkToken: string;
  onSuccess: (publicToken: string) => void;
  onExit: () => void;
  onError: (message: string) => void;
};

function PlaidLauncher({
  linkToken,
  onSuccess,
  onExit,
  onError,
}: PlaidLauncherProps) {
  const openedRef = useRef(false);

  const { open, ready, error } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken) => {
      if (!publicToken) {
        onError("Plaid did not return a public token.");
        return;
      }
      onSuccess(publicToken);
    },
    onExit: () => {
      openedRef.current = false;
      onExit();
    },
  });

  useEffect(() => {
    if (error) {
      onError(error.message || "Plaid Link failed to initialize.");
    }
  }, [error, onError]);

  useEffect(() => {
    if (!ready || openedRef.current) return;
    openedRef.current = true;
    open();
  }, [open, ready]);

  return null;
}

export default function BrokerImportControls({
  disabled = false,
  onImported,
  showTrigger = true,
  importRequestId = 0,
}: BrokerImportControlsProps) {
  const { t } = useI18n();
  const [connections, setConnections] = useState<BrokerConnectionSummary[]>(
    []
  );
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const loadConnections = useCallback(async () => {
    try {
      const data = await fetchBrokerConnections();
      setConnections(data);
    } catch {
      // Still allow first import if list fails.
    }
  }, []);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  const handlePlaidSuccess = useCallback(
    async (publicToken: string) => {
      setIsBusy(true);
      setError("");
      setStatusMessage("");
      setLinkToken(null);
      try {
        const result = await exchangeBrokerPublicToken(publicToken);
        setStatusMessage(
          t("brokerImportSuccess", {
            count: String(result.importedCount),
            name: result.institutionName ?? t("brokerAccount"),
          })
        );
        await loadConnections();
        await onImported();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("brokerImportFailed"));
      } finally {
        setIsBusy(false);
      }
    },
    [loadConnections, onImported, t]
  );

  const handlePlaidExit = useCallback(() => {
    setLinkToken(null);
    setIsBusy(false);
  }, []);

  const handlePlaidError = useCallback(
    (message: string) => {
      setError(message || t("brokerImportFailed"));
      setLinkToken(null);
      setIsBusy(false);
    },
    [t]
  );

  async function startImport() {
    if (disabled || isBusy) return;
    setIsBusy(true);
    setError("");
    setStatusMessage("");
    try {
      const token = await createBrokerLinkToken();
      setLinkToken(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("brokerImportFailed"));
      setIsBusy(false);
    }
  }

  useEffect(() => {
    if (importRequestId > 0) {
      void startImport();
    }
    // Only react to new external requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importRequestId]);

  async function handleSync(connectionId: string) {
    setIsBusy(true);
    setError("");
    try {
      const result = await syncBrokerConnections(connectionId);
      const count =
        result.importedCount ??
        result.results?.reduce((sum, row) => sum + row.importedCount, 0) ??
        0;
      setStatusMessage(t("brokerSyncSuccess", { count: String(count) }));
      await loadConnections();
      await onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("brokerSyncFailed"));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDisconnect(connectionId: string) {
    const confirmed = window.confirm(t("brokerDisconnectConfirm"));
    if (!confirmed) return;

    setIsBusy(true);
    setError("");
    try {
      await disconnectBrokerConnection(connectionId);
      setStatusMessage(t("brokerDisconnectSuccess"));
      await loadConnections();
      await onImported();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("brokerDisconnectFailed")
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <>
      {linkToken ? (
        <PlaidLauncher
          linkToken={linkToken}
          onSuccess={(token) => void handlePlaidSuccess(token)}
          onExit={handlePlaidExit}
          onError={handlePlaidError}
        />
      ) : null}

      {showTrigger && (
        <button
          type="button"
          disabled={disabled || isBusy}
          onClick={() => void startImport()}
          className="rounded-lg bg-[var(--accent)] px-5 py-3 font-semibold text-black transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {isBusy ? t("brokerImportWorking") : t("brokerImportCta")}
        </button>
      )}

      {(statusMessage || error || connections.length > 0) && (
        <div className="w-full basis-full space-y-2">
          {statusMessage && (
            <p className="text-sm text-green-400">{statusMessage}</p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}

          {connections.length > 0 && (
            <ul className="space-y-2">
              {connections.map((connection) => (
                <li
                  key={connection.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">
                      {connection.institutionName ?? t("brokerAccount")}
                    </p>
                    <p className="text-xs text-[var(--muted)] opacity-70">
                      {connection.lastSyncedAt
                        ? t("brokerLastSynced", {
                            time: new Date(
                              connection.lastSyncedAt
                            ).toLocaleString(),
                          })
                        : t("brokerNeverSynced")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={disabled || isBusy}
                      onClick={() => void handleSync(connection.id)}
                      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
                    >
                      {t("brokerSyncNow")}
                    </button>
                    <button
                      type="button"
                      disabled={disabled || isBusy}
                      onClick={() => void handleDisconnect(connection.id)}
                      className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-950/40 disabled:opacity-50"
                    >
                      {t("brokerDisconnect")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
