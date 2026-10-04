import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT, importPKCS8 } from "npm:jose@5";

const NAQL_COUNT = 55;
// Local-time slots, matched against 30 minute windows (cron runs at :00 and :30 UTC).
const SLOTS = ["05:00", "08:00", "11:00", "14:00", "15:00", "17:00", "20:00"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function authorized(req: Request) {
  const secret = Deno.env.get("CRON_SECRET") ?? "";
  const given = req.headers.get("x-cron-secret") ?? "";
  if (!secret || secret.length !== given.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

function localSlot(timeZone: string, now: Date): { time: string; key: string } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-GB", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(now);
  } catch {
    return localSlot("UTC", now);
  }
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const half = Number(p.minute) < 30 ? "00" : "30";
  return { time: `${p.hour}:${half}`, key: `${p.year}-${p.month}-${p.day}T${p.hour}:${half}` };
}

async function getAccessToken(account: { client_email: string; private_key: string }) {
  const key = await importPKCS8(account.private_key, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/firebase.messaging" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(account.client_email)
    .setSubject(account.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3000)
    .sign(key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) throw new Error(`Google OAuth failed with ${res.status}`);
  return (await res.json()).access_token as string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!authorized(req)) return json({ error: "Unauthorized" }, 401);
  const force = (await req.json().catch(() => ({}))).force === true;

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: rows, error } = await supabase
    .from("device_tokens").select("token, timezone, lang, last_sent_key").limit(5000);
  if (error) return json({ error: error.message }, 500);

  const now = new Date();
  const due = (rows ?? []).flatMap((row) => {
    const slot = localSlot(row.timezone, now);
    return force || (SLOTS.includes(slot.time) && row.last_sent_key !== slot.key)
      ? [{ ...row, slotKey: slot.key }] : [];
  });
  if (!due.length) return json({ due: 0 });

    let account;
  try {
    account = JSON.parse(atob(Deno.env.get("FCM_SERVICE_ACCOUNT_B64") ?? ""));
    if (!account.private_key || !account.client_email || !account.project_id) {
      throw new Error("missing fields in service account JSON");
    }
  } catch (e) {
    console.error("[send-naql-push] service account unreadable:", (e as Error).message);
    return json({ error: "FCM service account is not configured" }, 500);
  }
  const accessToken = await getAccessToken(account);
  const url = `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`;
  let sent = 0, removed = 0, failed = 0;

  for (let i = 0; i < due.length; i += 20) {
    await Promise.all(due.slice(i, i + 20).map(async (row) => {
      const n = 1 + Math.floor(Math.random() * NAQL_COUNT);
      const ur = row.lang === "ur";
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            token: row.token,
            notification: {
              title: ur ? `نقل ${n}` : `Naql ${n}`,
              body: ur ? "آج کا نقل پڑھنے کے لیے ٹیپ کریں۔" : "Tap to read today's naql.",
            },
            data: { naqlNumber: String(n) },
            android: { priority: "HIGH", notification: { channel_id: "naql-daily", color: "#17665F" } },
          },
        }),
      });
      if (res.ok) {
        sent++;
        await supabase.from("device_tokens").update({ last_sent_key: row.slotKey }).eq("token", row.token);
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.status === 404 || body?.error?.status === "NOT_FOUND" || body?.error?.status === "UNREGISTERED") {
        removed++;
        await supabase.from("device_tokens").delete().eq("token", row.token);
      } else {
        failed++;
        console.error("[send-naql-push] FCM error", res.status, JSON.stringify(body));
      }
    }));
  }
  return json({ due: due.length, sent, removed, failed });
});
