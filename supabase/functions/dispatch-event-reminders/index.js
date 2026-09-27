// supabase/functions/dispatch-event-reminders/index.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );

  const windowStart = new Date(Date.now() + 55 * 60_000);
  const windowEnd = new Date(Date.now() + 65 * 60_000);

  const { data: due } = await supabase
    .from('public_events')
    .select('id, title, region_id, gender_scope')
    .gte('starts_at', windowStart.toISOString())
    .lt('starts_at', windowEnd.toISOString());

  // tokensForRegionAndGender + sendToTokens come from the same shared
  // plumbing you'll build for feat-notifs — stub it out for now if that
  // isn't wired up yet, or skip this function until notifs lands.
  for (const event of due ?? []) {
    console.log('would notify for event:', event.title);
  }

  return new Response('ok');
});