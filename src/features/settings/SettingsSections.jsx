import AppIcon from "../../components/icons/AppIcon";
import { Button } from "../../components/shadcn/button";
import { Input } from "../../components/shadcn/input";
import { Label } from "../../components/shadcn/label";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/shadcn/avatar";
import { Toggle } from "../../components/shadcn/toggle";
import { ToggleGroup, ToggleGroupItem } from "../../components/shadcn/toggle-group";
import { Item, ItemContent, ItemGroup, ItemSeparator } from "../../components/shadcn/item";

export function SettingsProfileForm({ user, t, profile }) {
  const {
    displayName,
    setDisplayName,
    profileBusy,
    profileDirty,
    profileError,
    profileSuccess,
    avatarUrl,
    avatarPreview,
    avatarFile,
    removeAvatar,
    avatarInputRef,
    handleAvatarChange,
    handleProfileSave,
    setAvatarFile,
    setRemoveAvatar,
    setProfileError,
    setProfileSuccess,
  } = profile;
  if (!user) return null;
  return (
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
            <AvatarImage src={avatarPreview || (!removeAvatar ? avatarUrl : "") || undefined} alt="" />
            <AvatarFallback>{displayName.trim().slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
        </button>
        <Button type="button" variant="secondary" size="icon" className="absolute bottom-0 end-0 rounded-full" onClick={() => avatarInputRef.current?.click()} disabled={profileBusy} aria-label={t("settingsChangePhoto")}><AppIcon name="camera" size={20} /></Button>
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
          {profileError && <p className="settings-dashboard__error" role="alert">{profileError}</p>}
          {profileSuccess && <p className="settings-profile__success" role="status">{profileSuccess}</p>}
        </div>
      )}
      <div className="settings-profile__actions">
        <Button type="submit" busy={profileBusy} disabled={!profileDirty}>{t("settingsSaveProfile")}</Button>
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
  );
}

export function SettingsAccountSection({ user, isAnonymous, ready, accountBusy, onSignOut, t }) {
  return (
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
              <button type="button" onClick={onSignOut} disabled={accountBusy}>
                <ItemContent>{t("settingsLogout")}</ItemContent>
                {accountBusy && <span>{t("settingsLoading")}</span>}
              </button>
            </Item>
          </>
        )}
      </ItemGroup>
    </section>
  );
}

export function SettingsPreferencesSection({ darkMode, onThemeToggle, lang, chooseLang, t }) {
  return (
    <section className="settings-dashboard__section">
      <h2 className="settings-dashboard__heading">{t("settingsPreferences")}</h2>
      <ItemGroup className="settings-dashboard__group">
        <Item role="listitem" className="settings-dashboard__preference">
          <ItemContent className="settings-dashboard__preference-label">{darkMode ? t("toLightMode") : t("toDarkMode")}</ItemContent>
          <Toggle
            type="button"
            pressed={darkMode}
            onPressedChange={onThemeToggle}
            aria-label={darkMode ? t("toLightMode") : t("toDarkMode")}
            className="h-11 w-11 shrink-0 p-0"
          >
            <AppIcon name={darkMode ? "sun" : "moon"} size={19} />
          </Toggle>
        </Item>
        <ItemSeparator />
        <Item role="listitem" className="settings-dashboard__preference">
          <ItemContent className="settings-dashboard__preference-label"><span className="inline-flex items-center gap-3"><AppIcon name="globe" size={19} />{t("changeLang")}</span></ItemContent>
          <ToggleGroup type="single" value={lang} onValueChange={(value) => value && chooseLang(value)} aria-label={t("changeLang")} className="settings-dashboard__language">
            <ToggleGroupItem value="en" variant="outline" size="sm" className="min-h-11 min-w-11" aria-label={t("settingsLanguageEnglish")}>EN</ToggleGroupItem>
            <ToggleGroupItem value="ur" variant="outline" size="sm" className="min-h-11 min-w-11" aria-label={t("settingsLanguageUrdu")}>اردو</ToggleGroupItem>
          </ToggleGroup>
        </Item>
      </ItemGroup>
    </section>
  );
}
