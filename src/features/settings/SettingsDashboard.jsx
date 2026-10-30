/**
 * SettingsDashboard.jsx
 * Central settings/account page — language, theme, and auth
 * (anonymous backup-upgrade / sign-in) live here instead of buried
 * in the sidebar.
 */

import { useEffect, useRef, useState } from "react";
import { Browser } from "@capacitor/browser";
import { useLang } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import AppIcon from "@/components/icons/AppIcon";
import { Button } from "@/components/shadcn/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/shadcn/field";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn/avatar";
import FormError from "@/components/FormError";
import { Switch } from "@/components/shadcn/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { Item, ItemContent, ItemGroup, ItemSeparator } from "@/components/shadcn/item";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { MediaValidationError, uploadPostMedia, validateMediaFile } from "@/lib/cloudinaryUpload";
import { friendlyError } from "@/lib/supabaseClient.js";
import { supabase } from "@/lib/supabaseClient.js";
import { cloudinaryImageUrl } from "@/lib/cloudinaryUpload.js";
import { fetchBlockedUsers, unblockUser, updateSocialProfile } from "@/features/social/postsApi";
import { getDisplayName } from "@/features/auth/authSession";
import "@/features/settings/settingsdashboard.css";

const REMINDER_SLOTS_KEY = "ses-naql-slots-per-day";

function getSavedReminderSlotsPerDay() {
  try {
    const saved = localStorage.getItem(REMINDER_SLOTS_KEY);
    if (saved === null) return 7;
    const value = Number(saved);
    return [0, 1, 3, 7].includes(value) ? value : 7;
  } catch (error) {
    console.warn("[settings] could not read reminder preference", error);
    return 7;
  }
}

export default function SettingsDashboard({ darkMode, onThemeToggle }) {
  const { t, lang, chooseLang } = useLang();
  const { user, isAnonymous, ready, signOut, deleteAccount } = useAuth();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [savedDisplayName, setSavedDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [reminderSlotsPerDay, setReminderSlotsPerDay] = useState(getSavedReminderSlotsPerDay);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderError, setReminderError] = useState("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [blockedError, setBlockedError] = useState("");
  const [unblockingUserId, setUnblockingUserId] = useState("");
  const avatarInputRef = useRef(null);
  const profileDirtyRef = useRef(false);

  useEffect(() => {
    const metadata = user?.user_metadata || {};
    const name = getDisplayName(user);
    setDisplayName(name);
    setSavedDisplayName(name.trim());
    setAvatarUrl(metadata.avatar_url || "");
    setAvatarFile(null);
    setRemoveAvatar(false);
    setProfileError("");
    setProfileSuccess("");
  }, [user?.id]);

  useEffect(() => {
    if (!user || profileDirtyRef.current) return;
    const metadata = user.user_metadata || {};
    const name = getDisplayName(user);
    setDisplayName(name);
    setSavedDisplayName(name.trim());
    setAvatarUrl(metadata.avatar_url || "");
  }, [user?.user_metadata]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview("");
      return undefined;
    }
    const preview = URL.createObjectURL(avatarFile);
    setAvatarPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [avatarFile]);

  const profileDirty = Boolean(user) && (
    displayName.trim() !== savedDisplayName
    || Boolean(avatarFile)
    || (removeAvatar && Boolean(avatarUrl))
  );
  profileDirtyRef.current = profileDirty;
  const normalizedDeleteConfirmation = deleteConfirmation.trim();
  const accountEmail = (user?.email || "").trim().toLowerCase();
  const canConfirmDelete = accountEmail
    ? normalizedDeleteConfirmation.toLowerCase() === accountEmail
    : normalizedDeleteConfirmation.toUpperCase() === "DELETE";
  const deleteConfirmationMismatch = Boolean(normalizedDeleteConfirmation) && !canConfirmDelete;

  const handleSignOut = async () => {
    setAccountBusy(true);
    setAccountError("");
    try {
      await signOut();
    } catch (error) {
      setAccountError(friendlyError(error, t, "settingsActionError"));
    } finally {
      setAccountBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!canConfirmDelete || accountBusy) return;
    setAccountBusy(true);
    setAccountError("");
    try {
      await deleteAccount();
    } catch (error) {
      setAccountError(friendlyError(error, t, "settingsActionError"));
      setDeleteDialogOpen(false);
    } finally {
      setAccountBusy(false);
    }
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfileError("");
    setProfileSuccess("");
    try {
      validateMediaFile(file);
      if (!file.type.startsWith("image/")) throw new MediaValidationError("unsupportedType");
      setAvatarFile(file);
      setRemoveAvatar(false);
    } catch (error) {
      setAvatarFile(null);
      setProfileError(error.message === "imageTooLarge" ? t("socialImageTooLarge") : t("settingsAvatarInvalid"));
      event.target.value = "";
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    if (!profileDirty || profileBusy) return;
    const name = displayName.trim();
    if (name.length < 2 || name.length > 40) {
      setProfileError(t("settingsNameValidation"));
      return;
    }
    setProfileBusy(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const uploadedAvatar = avatarFile ? await uploadPostMedia(avatarFile) : null;
      const nextAvatarUrl = removeAvatar ? null : uploadedAvatar?.url || avatarUrl || null;
      await updateSocialProfile({ user, displayName: name, avatarUrl: nextAvatarUrl });
      setAvatarUrl(nextAvatarUrl || "");
      setSavedDisplayName(name);
      setAvatarFile(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      setRemoveAvatar(false);
      setProfileSuccess(t("settingsProfileSaved"));
    } catch (error) {
      setProfileError(friendlyError(error, t, "settingsProfileSaveError"));
    } finally {
      setProfileBusy(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (password.length < 8 || password !== passwordConfirmation || passwordBusy) return;
    setPasswordBusy(true);
    setPasswordError("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPasswordDialogOpen(false);
      setPassword("");
      setPasswordConfirmation("");
    } catch (error) {
      console.error("[settings] could not update password", error);
      setPasswordError(friendlyError(error, t, "settingsPasswordError"));
    } finally {
      setPasswordBusy(false);
    }
  };

  useEffect(() => {
    if (!blockedDialogOpen || !user?.id) return undefined;
    let cancelled = false;
    setBlockedLoading(true);
    setBlockedError("");
    fetchBlockedUsers(user.id)
      .then((result) => {
        if (!cancelled) setBlockedUsers(result);
      })
      .catch((error) => {
        console.error("[settings] could not load blocked users", error);
        if (!cancelled) setBlockedError(friendlyError(error, t, "settingsBlockedLoadError"));
      })
      .finally(() => {
        if (!cancelled) setBlockedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [blockedDialogOpen, t, user?.id]);

  const handleUnblock = async (blockedId) => {
    if (!user?.id || unblockingUserId) return;
    setUnblockingUserId(blockedId);
    setBlockedError("");
    try {
      await unblockUser(user.id, blockedId);
      setBlockedUsers((current) => current.filter(({ id }) => id !== blockedId));
    } catch (error) {
      console.error("[settings] could not unblock user", error);
      setBlockedError(friendlyError(error, t, "settingsUnblockError"));
    } finally {
      setUnblockingUserId("");
    }
  };

  const openPolicy = async (path) => {
    const baseUrl = import.meta.env.VITE_PUBLIC_URL || "https://ses-mvp.vercel.app";
    try {
      await Browser.open({ url: new URL(path, `${baseUrl.replace(/\/+$/, "")}/`).toString() });
    } catch (error) {
      console.error("[settings] could not open policy page", error);
      setAccountError(friendlyError(error, t, "settingsActionError"));
    }
  };

  const saveReminderSlotsPerDay = async (slotsPerDay) => {
    if (![0, 1, 3, 7].includes(slotsPerDay) || reminderBusy) return;
    setReminderBusy(true);
    setReminderError("");
    try {
      localStorage.setItem(REMINDER_SLOTS_KEY, String(slotsPerDay));
      setReminderSlotsPerDay(slotsPerDay);
      const { error } = await supabase.rpc("set_naql_reminder_slots", {
        p_slots_per_day: slotsPerDay,
      });
      if (error) throw error;
      const { scheduleNextNaqlNotification } = await import("@/notifications/naqlNotifications");
      await scheduleNextNaqlNotification();
    } catch (error) {
      console.error("[settings] could not sync reminder preference", error);
      setReminderError(t("settingsReminderSaveError"));
    } finally {
      setReminderBusy(false);
    }
  };

  return (
    <div className="settings-dashboard">
      {user && (
        <form className="settings-profile" onSubmit={handleProfileSave}>
          <div className="settings-profile__avatar-wrap relative mx-auto size-24">
            <button
              type="button"
              className="settings-profile__avatar-button size-24 rounded-full"
              disabled={profileBusy}
              onClick={() => avatarInputRef.current?.click()}
              aria-label={t("settingsChangePhoto")}
            >
              <Avatar className="size-24">
                <AvatarImage
                  src={avatarPreview || (!removeAvatar ? cloudinaryImageUrl(avatarUrl, "c_fill,w_256,h_256,f_auto,q_auto") : "") || undefined}
                  alt=""
                />
                <AvatarFallback>{displayName.trim().slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
            </button>
            <span aria-hidden="true" className="pointer-events-none absolute bottom-0 end-0 grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <AppIcon name="camera" size={18} />
            </span>
            <input
              ref={avatarInputRef}
              className="settings-profile__file"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={profileBusy}
              aria-label={t("settingsAvatar")}
            />
          </div>
          <Label className="settings-profile__name-label" htmlFor="settings-display-name">{t("settingsDisplayName")}</Label>
          <Input
            id="settings-display-name"
            type="text"
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setProfileError("");
              setProfileSuccess("");
            }}
            placeholder={t("settingsDisplayNamePlaceholder")}
            maxLength={40}
            autoComplete="name"
            disabled={profileBusy}
            required
          />
          {(profileError || profileSuccess) && (
            <div className="settings-profile__feedback">
              <FormError message={profileError} />
              {profileSuccess && <p className="settings-profile__success" role="status">{profileSuccess}</p>}
            </div>
          )}
          <div className="settings-profile__actions">
            <Button type="submit" busy={profileBusy} loadingLabel={t("settingsSavingProfile")} disabled={!profileDirty}>{t("settingsSaveProfile")}</Button>
            {(avatarUrl || avatarFile) && !removeAvatar && (
              <Button
                type="button"
                disabled={profileBusy}
                variant="ghost"
                onClick={() => {
                  setAvatarFile(null);
                  if (avatarInputRef.current) avatarInputRef.current.value = "";
                  setRemoveAvatar(Boolean(avatarUrl));
                  setProfileError("");
                  setProfileSuccess("");
                }}
              >
                {t("settingsRemoveAvatar")}
              </Button>
            )}
          </div>
        </form>
      )}

      <section className="settings-dashboard__section">
        <h2 className="settings-dashboard__heading">{t("settingsAccount")}</h2>
        <ItemGroup className="settings-dashboard__group">
          {!ready ? (
            <Item role="listitem" className="settings-dashboard__row"><ItemContent><span className="settings-dashboard__muted">{t("settingsLoading")}</span></ItemContent></Item>
          ) : (
            <>
              <Item role="listitem" className="settings-dashboard__row"><ItemContent>{isAnonymous
                ? <span className="settings-dashboard__muted">{t("settingsAnonymousDesc")}</span>
                : <span className="settings-dashboard__email">{user?.email}</span>}</ItemContent></Item>
              <ItemSeparator />
              <Item asChild role="listitem" className="settings-dashboard__row settings-dashboard__row-action">
                <button type="button" onClick={handleSignOut} disabled={accountBusy}>
                  <ItemContent>{t("settingsLogout")}</ItemContent>
                  {accountBusy && <span>{t("settingsLoading")}</span>}
                </button>
              </Item>
            </>
          )}
        </ItemGroup>
      </section>

      <section className="settings-dashboard__section">
        <h2 className="settings-dashboard__heading">{t("settingsPreferences")}</h2>
        <ItemGroup className="settings-dashboard__group">
          <Item role="listitem" className="settings-dashboard__preference">
            <ItemContent className="settings-dashboard__preference-label">{t("settingsDarkMode")}</ItemContent>
            <Switch checked={darkMode} onCheckedChange={onThemeToggle} aria-label={t("settingsDarkMode")} />
          </Item>
          <ItemSeparator />
          <Item role="listitem" className="settings-dashboard__preference">
            <ItemContent className="settings-dashboard__preference-label"><span className="inline-flex items-center gap-3"><AppIcon name="globe" size={19} />{t("changeLang")}</span></ItemContent>
            <Select value={lang} onValueChange={chooseLang}>
              <SelectTrigger className="min-h-11" aria-label={t("changeLang")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t("settingsLanguageEnglish")}</SelectItem>
                <SelectItem value="ur">{t("settingsLanguageUrdu")}</SelectItem>
              </SelectContent>
            </Select>
          </Item>
        </ItemGroup>
      </section>
      <section className="settings-dashboard__section">
        <h2 className="settings-dashboard__heading">{t("settingsNotifications")}</h2>
        <ItemGroup className="settings-dashboard__group">
          <Item role="listitem" className="settings-dashboard__preference settings-dashboard__reminders">
            <ItemContent className="settings-dashboard__preference-label">{t("settingsDailyNaqlReminders")}</ItemContent>
            <div className="settings-dashboard__reminder-controls">
              <Select
                value={String(reminderSlotsPerDay || 7)}
                onValueChange={(value) => void saveReminderSlotsPerDay(Number(value))}
                disabled={reminderBusy || reminderSlotsPerDay === 0}
              >
                <SelectTrigger className="settings-dashboard__reminder-select min-h-11" aria-label={t("settingsReminderCount")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t("settingsReminderOnce")}</SelectItem>
                  <SelectItem value="3">{t("settingsReminderThrice")}</SelectItem>
                  <SelectItem value="7">{t("settingsReminderSeven")}</SelectItem>
                </SelectContent>
              </Select>
              <Switch
                checked={reminderSlotsPerDay > 0}
                onCheckedChange={(enabled) => void saveReminderSlotsPerDay(enabled ? (reminderSlotsPerDay || 7) : 0)}
                disabled={reminderBusy}
                aria-label={t("settingsDailyNaqlReminders")}
              />
            </div>
          </Item>
          <FormError message={reminderError} />
        </ItemGroup>
      </section>
      <section className="settings-dashboard__section">
        <h2 className="settings-dashboard__heading">{t("settingsAccountPrivacy")}</h2>
        <ItemGroup className="settings-dashboard__group">
          <Item asChild role="listitem" className="settings-dashboard__row settings-dashboard__row-action">
            <button type="button" onClick={() => {
              setPasswordError("");
              setPasswordDialogOpen(true);
            }} disabled={!user || isAnonymous}>
              <ItemContent>{t("settingsChangePassword")}</ItemContent>
            </button>
          </Item>
          <ItemSeparator />
          <Item asChild role="listitem" className="settings-dashboard__row settings-dashboard__row-action">
            <button type="button" onClick={() => setBlockedDialogOpen(true)} disabled={!user || isAnonymous}>
              <ItemContent>{t("settingsBlockedUsers")}</ItemContent>
            </button>
          </Item>
          <ItemSeparator />
          <Item asChild role="listitem" className="settings-dashboard__row settings-dashboard__row-action">
            <button type="button" onClick={() => void openPolicy("/terms")}>
              <ItemContent>{t("settingsTerms")}</ItemContent>
            </button>
          </Item>
          <ItemSeparator />
          <Item asChild role="listitem" className="settings-dashboard__row settings-dashboard__row-action">
            <button type="button" onClick={() => void openPolicy("/privacy")}>
              <ItemContent>{t("settingsPrivacy")}</ItemContent>
            </button>
          </Item>
        </ItemGroup>
      </section>
      <section className="settings-dashboard__danger">
        <h2 className="settings-dashboard__danger-heading">{t("settingsDangerZone")}</h2>
        <div className="settings-dashboard__danger-row">
          <div className="settings-dashboard__danger-copy">
            <h3>{t("settingsDangerTitle")}</h3>
            <p>{t("settingsDangerDescription")}</p>
          </div>
          <Button
            type="button"
            className="shrink-0 max-sm:w-full"
            disabled={accountBusy}
            variant="destructive-outline"
            onClick={() => {
              setAccountError("");
              setDeleteConfirmation("");
              setDeleteDialogOpen(true);
            }}
          >
            {t("settingsDeleteAccount")}
          </Button>
        </div>
      </section>
      <FormError message={accountError} />

      <Dialog open={passwordDialogOpen} onOpenChange={(open) => {
        if (passwordBusy) return;
        setPasswordDialogOpen(open);
        if (!open) {
          setPassword("");
          setPasswordConfirmation("");
          setPasswordError("");
        }
      }}>
        <DialogContent closeLabel={t("closeSheet")}>
          <DialogHeader>
            <DialogTitle>{t("settingsChangePassword")}</DialogTitle>
            <DialogDescription>{t("settingsPasswordDescription")}</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handlePasswordChange}>
            <Field>
              <FieldLabel htmlFor="settings-new-password">{t("settingsNewPassword")}</FieldLabel>
              <Input
                id="settings-new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
                disabled={passwordBusy}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-confirm-password">{t("settingsConfirmPassword")}</FieldLabel>
              <Input
                id="settings-confirm-password"
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                minLength={8}
                required
                disabled={passwordBusy}
              />
            </Field>
            <FieldError>{passwordError || (passwordConfirmation && password !== passwordConfirmation ? t("settingsPasswordMismatch") : "")}</FieldError>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)} disabled={passwordBusy}>
                {t("settingsDeleteCancel")}
              </Button>
              <Button type="submit" disabled={password.length < 8 || password !== passwordConfirmation || passwordBusy} busy={passwordBusy} loadingLabel={t("settingsSavingPassword")}>
                {t("settingsSavePassword")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={blockedDialogOpen} onOpenChange={setBlockedDialogOpen}>
        <DialogContent closeLabel={t("closeSheet")} className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("settingsBlockedUsers")}</DialogTitle>
            <DialogDescription>{t("settingsBlockedUsersDescription")}</DialogDescription>
          </DialogHeader>
          {blockedLoading && <p className="text-sm text-muted-foreground" role="status">{t("settingsLoading")}</p>}
          {!blockedLoading && !blockedUsers.length && !blockedError && (
            <p className="text-sm text-muted-foreground">{t("settingsNoBlockedUsers")}</p>
          )}
          {blockedUsers.map(({ id, displayName: blockedName }) => (
            <Item key={id} className="justify-between">
              <ItemContent>{blockedName || t("socialUnknownAuthor")}</ItemContent>
              <Button type="button" size="sm" variant="outline" disabled={Boolean(unblockingUserId)} busy={unblockingUserId === id} loadingLabel={t("settingsUnblocking")} onClick={() => void handleUnblock(id)}>
                {t("settingsUnblock")}
              </Button>
            </Item>
          ))}
          {blockedError && <p className="text-sm text-destructive" role="alert">{blockedError}</p>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (open) setDeleteDialogOpen(true);
        else {
          if (!accountBusy) {
            setDeleteDialogOpen(false);
            setDeleteConfirmation("");
          }
        }
      }}
      >
        <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("settingsDeleteConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("settingsDeleteWarning")}</AlertDialogDescription>
        </AlertDialogHeader>
        <Field className="settings-delete__field">
          <FieldLabel htmlFor="settings-delete-confirmation">{t("settingsDeleteConfirmLabel")}</FieldLabel>
          <Input
            id="settings-delete-confirmation"
            type="text"
            autoComplete="off"
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder={accountEmail
              ? t("settingsDeleteEmailPlaceholder")
              : t("settingsDeleteWordPlaceholder")}
            aria-describedby="settings-delete-confirmation-hint"
            disabled={accountBusy}
          />
          <FieldDescription id="settings-delete-confirmation-hint">
            {accountEmail
              ? <>{t("settingsDeleteConfirmHintEmail")} <code className="rounded bg-muted px-1 py-0.5">{accountEmail}</code></>
              : t("settingsDeleteConfirmHintWord")}
          </FieldDescription>
          <FieldError>{deleteConfirmationMismatch ? t("settingsDeleteConfirmationMismatch") : ""}</FieldError>
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={accountBusy} onClick={() => setDeleteConfirmation("")}>
            {t("settingsDeleteCancel")}
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={accountBusy || !canConfirmDelete}
            variant="destructive-outline"
            busy={accountBusy}
            loadingLabel={t("settingsDeleting")}
            onClick={handleDeleteAccount}
          >
            {t("settingsDeleteConfirm")}
          </Button>
        </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}