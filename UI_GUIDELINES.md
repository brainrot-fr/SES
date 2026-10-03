# SES UI Guidelines

This file is mandatory reading before any UI work: new pages, new components, CSS edits, layout tweaks, "small" visual changes. If a request conflicts with this file, follow the file and tell the user why.

## 0. Preflight (post this before writing code)

1. Template: which one from section 4 does this screen use?
2. Surfaces: which tier (section 3) is each region?
3. Depth: what is the maximum container depth? It must be 1 or less.
4. Regions on desktop (>=1024px): list them. One column is only acceptable for Reader, Feed and Form templates.
5. What existing primitive or class am I reusing? Am I deleting the old CSS I replace?

If any answer is "boxes inside boxes" or "another card", stop and redesign.

## 1. Product feel

SES is a reading and community app. Reference feel:

- Reading (Nuqool, Quran): Kindle, Apple Books. The text is the interface. Chrome is quiet.
- Feed: Threads. Rows and hairlines, not cards.
- Player: Spotify. A docked bar that expands into a sheet.
- Settings: iOS Settings. Grouped rows.
- Reels: already correct, do not redesign.

Colors, gradients and tokens are final and live in src/styles/tokens.css. Never add hex values or new gradients. Use tokens only.

## 2. Non-negotiables

1. Cards are the exception. Default is content on the page canvas. The shadcn Card is allowed only in the Feed template.
2. Never nest containers. A container is anything with a border, a background different from its parent, or a shadow.
3. Separate with hairlines (1px var(--hairline)) and whitespace, not boxes.
4. No shadows on in-flow content. Floating layers (sheet, popover, docked player, fixed navigation) may use the shared soft layered shadow tokens and their subtle top highlight. Avoid backdrop blur on expensive fixed controls; use an opaque token surface instead.
5. No icon-in-tinted-square tiles. No tile grids that repeat the navigation.
6. No eyebrow + h1 + muted subtitle header stack. The page title lives in the app header. If a page needs a hero, it is one strong element (large numeral, Arabic display text, or a band), not three stacked lines.
7. Pills are for chips, filters and segmented controls only. Actions are icon buttons, text buttons or one solid primary button.
8. On desktop, use a real 2D layout. Do not center a phone column and leave the rest empty.
9. Max one docked bar above the bottom nav at a time.
10. Replace, do not layer. Never append an override block to a CSS file. Edit or delete the original rule.
11. Existing page-canvas ambient gradients and full-bleed Band gradients are the only gradient-surface exceptions; use their named tokens from tokens.css. Bands may use the centered fading glow and faint static star mask tokens. These effects must not create a content container.

## 3. Surface tiers

| Tier | What | Border | Radius | Shadow |
|---|---|---|---|---|
| Canvas | page background, most content | none | none | none |
| Band | full-bleed tinted region with a centered fading token glow and faint static star mask | none | none | none |
| Row | item in a list, divided by hairlines | hairline between rows only | none | none |
| Group | one grouped surface for settings-style rows | none or one hairline | var(--radius-md) on the outer edge only | none |
| Panel | modal, sheet, popover, docked player, composer input when floating | yes | var(--radius-lg) on floating edges | soft layered token shadow with a subtle top highlight |
| Media | image or video in a feed | none | var(--radius-sm) | none |

Depth budget: Canvas > (Band | Row list | Group | Panel) > content. Nothing goes inside a Group, Band or Row that has its own border, background or shadow. Sheets and modals reset depth to 0.

## 4. Page templates (pick exactly one)

- Reader: Nuqool, Quran reader. Single reading column (max var(--measure-reading), about 68ch). No box. Docked bottom bar for navigation. Desktop: sticky index rail on the inline-start side.
- Index: Quran list, any long list of things. Compact sticky header with search, RowList, "Continue" row on top. Desktop: list rail plus detail (master-detail).
- Feed: Social. Column max var(--measure-feed). Rows with avatar gutter, hairlines, full-bleed on mobile.
- Split: Dashboard, Timeline, Murshid, ReelUpload. Two regions on desktop (sticky region + scrolling region). Mobile stacks with bands and dividers, not cards.
- Settings/Form: grouped lists (Group), sticky action bar for the primary action.
- Immersive: Reels. Full screen, dark, overlay controls. Approved exception: allow the Reels media and layout refinements in the active brief, including contain-fit video, Cloudinary posters, progress and tag overlays, and a desktop action rail beside the frame. Hide page-canvas ambient gradients while Reels is active; other gradient and container rules still apply.
- Entry: Auth, Account onboarding, Language onboarding. No card. Desktop: split screen with brand panel and form on canvas. Mobile: full page, sticky bottom action.

Route map: /dashboard Split, /nuqool Reader, /quran Index, /quran/:s Reader, /timeline Split, /murshid Split, /social Feed, /social/create Form, /reels Immersive, /reels/create Split, /settings Settings, auth and onboarding Entry.

## 5. Layout primitives

Live in src/components/layout/ with styles in src/styles/layout.css. Use them before writing page-specific CSS.

- Page: sets width variant (reading, feed, app), gutter and vertical rhythm.
- Band: full-bleed region, optional gradient from existing tokens.
- Split: rail + main, sticky rail at >=1024px, stacked below.
- RowList / Row: hairline-divided rows, min-height 56px, slots for leading, content, trailing.
- Group: settings-style grouped surface, rows inside.
- Sheet: bottom sheet on mobile, side or centered panel on desktop (wraps the existing Modal).
- PageHeader: compact, only when a page truly needs an in-page header (search, filters). Never eyebrow + h1 + subtitle.
- Dock: docked bottom bar that respects the safe area and the bottom nav offset.

Base variables (layout.css, spacing only, no colors):

```css
:root {
  --page-gutter: clamp(1rem, 4vw, 2rem);
  --measure-reading: 68ch;
  --measure-feed: 40rem;
  --dock-offset: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px));
}
```

Patterns:

```css
.row-list { display: grid; }
.row {
  display: flex; align-items: center; gap: var(--space-3);
  min-height: 56px; padding: var(--space-3) var(--page-gutter);
}
.row + .row { border-block-start: 1px solid var(--hairline); }

.band {
  padding: var(--space-6) var(--page-gutter);
  background: var(--gradient-band);
}

.split { display: grid; gap: var(--space-6); }
@media (min-width: 1024px) {
  .split { grid-template-columns: minmax(16rem, 22rem) minmax(0, 1fr); align-items: start; }
  .split__rail { position: sticky; top: calc(var(--header-height) + var(--space-4)); }
}

.dock {
  position: fixed; inset-inline: 0; bottom: var(--dock-offset);
  background: var(--surface-1); border-block-start: 1px solid var(--hairline);
}
```

## 6. Component patterns

- Buttons: one solid primary per screen region at most. Others are ghost or text. Icon buttons are 44px, no background until hover or active.
- Pressed tappable rows use a `var(--primary-soft)` tint and `scale(0.98)`; suppress the scale for reduced-motion users.
- Chips (pill): only for filters, topics, segmented controls.
- Segmented control: for view modes and 2 to 3 option switches (Verse/Reading, EN/اردو, Tarbiyat/Faqiri).
- Selected or playing state: full-width primary-soft band plus a 3px inline-start bar. Never a bordered box.
- Quotes and emphasis inside reading text: pull-quote with an inline-start accent rule. No boxes.
- Inputs: the only bordered things allowed inside a Group or form. Radius var(--radius-sm).
- Empty states: inline text and one action on the canvas. No dashed boxes.
- Sheets replace modals for pickers (number grid, reader settings, comments).
- Player: docked bar (title, progress hairline, play/pause) that expands into a Sheet. Keep the hook where it is, restyle only.
- Danger actions: plain danger-colored text row, separated by space, confirmation in a Modal.
- Use components from src/components/shadcn before writing custom ones. Keep project-specific variants and sizes aligned with the 44px target minimum.

## 7. Typography

- Hierarchy comes from size and weight contrast, not from labels. Use a big numeral, big Arabic text, or a strong title. Do not add eyebrows.
- Use Manrope 800 (`--font-page-title`) with approximately `-0.03em` tracking for page titles; use Cormorant Garamond (`--font-hero`) for larger hero numerals or display figures, clearly sized above body text.
- Arabic reading text uses --font-arabic (QPCHafs), Indopak for bismillah where already used. Numerals use font-variant-numeric: tabular-nums.
- Body 16px minimum, reading text line-height 1.9 or more, measure capped at var(--measure-reading).
- Uppercase letter-spaced labels are banned except tiny metadata.

## 8. Spacing, radius, shadow

- Spacing only from --space-* tokens. Vertical rhythm between regions is --space-6 or --space-7, inside groups --space-3 or --space-4.
- Radius: rows and bands 0, inputs --radius-sm, media --radius-sm, floating panels --radius-lg on their floating edges, chips pill. Never radius-lg on in-flow content.
- Shadow: floating layers only.

## 9. Tokens

Use var(--...) from tokens.css only: colors, spacing, radius, durations, easing. If something is missing, add a spacing or measure variable to layout.css. Do not add colors or gradients without the owner's approval.

## 10. Platform rules

- RTL: use logical properties (margin-inline, padding-inline, inset-inline, border-inline-start, text-align: start). Flip directional icons like the existing [dir="rtl"] rules do.
- i18n: every string in both en.js and ur.js. No hardcoded text.
- A11y: 44px targets, visible :focus-visible ring, aria labels on icon buttons, dialogs use the Modal or Sheet.
- Capacitor: respect env(safe-area-inset-*), no hover-only affordances, no fixed elements colliding with the bottom nav or dock.
- Motion: framer-motion for route and sheet transitions. The app canvas may use one fixed ambient `::before` layer with low-amplitude transform-only drift over 38 seconds; hide it during Reels and disable it for `prefers-reduced-motion`. Keep centered Band glows, star masks, reading-surface, component and functional gradients static. Suppress press-scale motion for reduced-motion users. Honor reduced motion for all transitions (MotionConfig already does).
- Dark mode: works through tokens automatically. Test both themes.

## 11. Banned (with examples found in this repo)

- Box per item: .quran-ayah, .tl-card, .murshid-chain__item, .dashboard__card, .quran-list__item, .social-post. The approved shadcn Card remains allowed only in the Feed template.
- Box wrapping a page: .naql-body, .quran-body, .reel-upload, .post-create-page__form.
- Box in a box: settings section > account box > profile form, composer inside form wrapper, cite with border-top inside a boxed reading area.
- Centered card for auth or onboarding.
- Icon tile + title + description + arrow grids.
- Eyebrow + h1 + subtitle headers.
- Three floating blurred panels stacked at the bottom.
- Pill-bordered action buttons on every post.
- Bubble backgrounds on comments.
- Stacked duplicate media queries or "polish" override blocks.

## 12. Adding a new page or component

1. Run the preflight in section 0 and post it.
2. Pick the template and reuse the primitives from section 5.
3. Write CSS in the feature folder using layout tokens. No new container recipe. If a new one seems necessary, ask first.
4. Add strings to en.js and ur.js.
5. Check: mobile 360px, tablet 768px, desktop 1280px, RTL, dark mode.
6. If you changed an existing page, delete the old CSS you replaced.

## 13. Final review checklist

- [ ] Container depth is 1 or less everywhere.
- [ ] No shadows on in-flow content.
- [ ] No banned pattern from section 11 was introduced.
- [ ] Desktop shows the template's intended regions, not a stretched phone layout.
- [ ] Only tokens used, no new colors.
- [ ] RTL and dark mode verified.
- [ ] No dead or duplicated CSS left behind.
- [ ] lint and build pass.
