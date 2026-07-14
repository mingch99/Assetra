"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  changePassword,
  deleteAccount,
  getDisplayName,
  updateProfile,
} from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";
import { useI18n } from "@/lib/i18n/LanguageProvider";

type UserMenuProps = {
  user: AuthUser;
  onUserUpdate: (user: AuthUser) => void;
  onLogout: () => void;
  onAccountDeleted: () => void;
};

type MenuView = "main" | "settings";

export default function UserMenu({
  user,
  onUserUpdate,
  onLogout,
  onAccountDeleted,
}: UserMenuProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<MenuView>("main");

  const [nicknameInput, setNicknameInput] = useState(user.username ?? "");
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const displayName = getDisplayName(user);

  const resetTransientState = useCallback(() => {
    setView("main");
    setNicknameMessage("");
    setPasswordMessage("");
    setPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsConfirmingDelete(false);
    setDeleteError("");
    setDeletePassword("");
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        resetTransientState();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen, resetTransientState]);

  function toggleMenu() {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) resetTransientState();
      return next;
    });
  }

  async function handleSaveNickname() {
    setNicknameMessage("");
    setIsSavingNickname(true);
    try {
      const trimmed = nicknameInput.trim();
      const updatedUser = await updateProfile({
        username: trimmed.length > 0 ? trimmed : null,
      });
      onUserUpdate(updatedUser);
      setNicknameInput(updatedUser.username ?? "");
      setNicknameMessage(t("nicknameUpdated"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("nicknameUpdateFailed");
      setNicknameMessage(message);
    } finally {
      setIsSavingNickname(false);
    }
  }

  async function handleChangePassword() {
    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError(t("enterCurrentPassword"));
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(t("newPasswordMinError"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("passwordsDoNotMatch"));
      return;
    }

    setIsSavingPassword(true);
    try {
      const result = await changePassword({ currentPassword, newPassword });
      setPasswordMessage(result.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("passwordUpdateFailed");
      setPasswordError(message);
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError("");

    if (!deletePassword) {
      setDeleteError(t("enterPasswordToConfirm"));
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount(deletePassword);
      onAccountDeleted();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("deleteAccountFailed");
      setDeleteError(message);
      setIsDeleting(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleMenu}
        className="h-11 w-11 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] font-semibold"
      >
        {displayName.charAt(0).toUpperCase()}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg">
          {view === "main" ? (
            <div>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                Hi, {displayName}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">{user.email}</p>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setView("settings");
                    setNicknameMessage("");
                    setPasswordMessage("");
                    setPasswordError("");
                    setDeleteError("");
                    setIsConfirmingDelete(false);
                  }}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface)] transition"
                >
                  {t("settings")}
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full rounded-lg border border-red-500/40 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition"
                >
                  {t("logOut")}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setView("main")}
                  className="text-sm text-[var(--muted)] hover:text-[var(--accent)]"
                >
                  ← {t("back")}
                </button>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {t("settings")}
                </p>
              </div>

              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
                  {t("nicknameLabel")}
                </label>
                <input
                  type="text"
                  placeholder={t("nicknamePlaceholder")}
                  maxLength={30}
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
                />
                <button
                  type="button"
                  onClick={handleSaveNickname}
                  disabled={isSavingNickname}
                  className="mt-2 w-full rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-black hover:bg-[var(--accent-hover)] transition disabled:opacity-60"
                >
                  {isSavingNickname ? t("saving") : t("saveNickname")}
                </button>
                {nicknameMessage && (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {nicknameMessage}
                  </p>
                )}
              </div>

              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
                  {t("changePassword")}
                </label>
                <input
                  type="password"
                  placeholder={t("currentPassword")}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
                />
                <input
                  type="password"
                  placeholder={t("newPasswordMin")}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
                />
                <input
                  type="password"
                  placeholder={t("confirmNewPassword")}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
                />
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isSavingPassword}
                  className="mt-2 w-full rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-black hover:bg-[var(--accent-hover)] transition disabled:opacity-60"
                >
                  {isSavingPassword ? t("updating") : t("updatePassword")}
                </button>
                {passwordError && (
                  <p className="mt-2 text-xs text-red-400">{passwordError}</p>
                )}
                {passwordMessage && (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {passwordMessage}
                  </p>
                )}
              </div>

              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <label className="mb-1 block text-sm font-medium text-red-400">
                  {t("dangerZone")}
                </label>
                {!isConfirmingDelete ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfirmingDelete(true);
                      setDeleteError("");
                      setDeletePassword("");
                    }}
                    className="w-full rounded-lg border border-red-500/40 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition"
                  >
                    {t("deleteAccount")}
                  </button>
                ) : (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3">
                    <p className="text-xs text-red-300">
                      {t("deleteAccountWarning")}
                    </p>
                    <input
                      type="password"
                      placeholder={t("passwordToConfirm")}
                      autoComplete="current-password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="mt-3 w-full rounded-lg border border-red-500/40 bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsConfirmingDelete(false);
                          setDeletePassword("");
                          setDeleteError("");
                        }}
                        disabled={isDeleting}
                        className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-2)] transition disabled:opacity-60"
                      >
                        {t("cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 transition disabled:opacity-60"
                      >
                        {isDeleting ? t("deleting") : t("confirmDelete")}
                      </button>
                    </div>
                    {deleteError && (
                      <p className="mt-2 text-xs text-red-300">{deleteError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
