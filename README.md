# SES

## Google sign-in

In Supabase Auth URL Configuration, allow `https://ses-mvp.vercel.app/**` and
`ses://auth-callback` as redirect URLs. In the Google OAuth client, use the
Supabase project's `https://<project-ref>.supabase.co/auth/v1/callback` as its
authorized redirect URI.

## Android APK releases

Add the GitHub repository secrets `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY`. Pushing any tag whose commit is on `main` builds a
debug APK and attaches it to a GitHub Release.

## Quran audio duration index

Run `npm run quran:audio-index` to download each listed reciter's ayah audio to
the ignored `.cache/quran-audio/` directory and generate
`public/quran-audio-durations.json`. The app continues to stream audio; the
audio cache is never bundled. Run the index command before building or
deploying when exact surah durations are required, because the generated JSON
is intentionally ignored by Git. The indexer tries 64 kbps first, then the
full standard MPEG bitrate ladder from 448 down to 8 kbps, retries transient
downloads, and falls back when a bitrate is unavailable or serves invalid
audio.

## Islamic dates

The dashboard requests Hijri dates from the public AlAdhan calendar API. A
saved country of India, Pakistan, Bangladesh, or Afghanistan uses the date one
day before Saudi Arabia; other countries and accounts without a country use
the Saudi date.

## Supabase schema updates

Deploy the pending migrations under `supabase/migrations/` before releasing the
account onboarding, gender-separated feeds, and social engagement features.
They add account profile fields and policies, plus follows, views, shares, and
reply-capable comments.
