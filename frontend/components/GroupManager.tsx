"use client";

import { useEffect, useRef, useState } from "react";
import type { AssetGroup } from "@/types/asset";
import { useI18n } from "@/lib/i18n/LanguageProvider";

type GroupManagerProps = {
  groups: AssetGroup[];
  onCreateGroup: (name: string) => Promise<void>;
  onRenameGroup: (groupId: string, name: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
};

export default function GroupManager({
  groups,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
}: GroupManagerProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingId(null);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) {
      setError(t("enterGroupName"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onCreateGroup(trimmed);
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createGroupFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleRename(groupId: string) {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setError(t("enterGroupName"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onRenameGroup(groupId, trimmed);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("renameGroupFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface)]"
      >
        {t("manageGroups")}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg">
          <p className="mb-2 text-sm font-semibold text-[var(--accent)]">
            {t("groupsTitle")}
          </p>
          <div className="mb-3 flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("newGroupName")}
              className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-[var(--foreground)]"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleCreate()}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-black disabled:opacity-60"
            >
              {t("add")}
            </button>
          </div>

          {groups.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">{t("noGroupsYet")}</p>
          ) : (
            <ul className="max-h-56 space-y-2 overflow-auto">
              {groups.map((group) => (
                <li
                  key={group.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2"
                >
                  {editingId === group.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleRename(group.id)}
                          className="rounded bg-[var(--accent)] px-2 py-1 text-xs font-semibold text-black"
                        >
                          {t("save")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded border border-[var(--border)] px-2 py-1 text-xs"
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {group.name}
                      </span>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                          onClick={() => {
                            setEditingId(group.id);
                            setEditingName(group.name);
                            setError("");
                          }}
                        >
                          {t("rename")}
                        </button>
                        <button
                          type="button"
                          className="text-xs text-red-400 hover:underline"
                          onClick={() => {
                            if (
                              window.confirm(
                                t("deleteGroupConfirm", { name: group.name })
                              )
                            ) {
                              void onDeleteGroup(group.id);
                            }
                          }}
                        >
                          {t("delete")}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
