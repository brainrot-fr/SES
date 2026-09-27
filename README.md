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
