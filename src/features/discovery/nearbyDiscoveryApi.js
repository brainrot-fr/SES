import { supabase } from '../../lib/supabaseClient';

export async function fetchNearbyPeople({ regionId, gender, userId, myInterests }) {
  const { data, error } = await supabase
    .from('discovery_profiles')
    .select('user_id, display_name, age_band, interests')
    .eq('region_id', regionId)
    .eq('gender', gender)
    .eq('discovery_visible', true)
    .neq('user_id', userId);
  if (error) throw error;

  return data
    .map((p) => ({ ...p, sharedCount: p.interests.filter((i) => myInterests.includes(i)).length }))
    .sort((a, b) => b.sharedCount - a.sharedCount);
}

export async function upsertDiscoveryProfile(payload) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('discovery_profiles')
    .upsert({ ...payload, user_id: user.id, discovery_visible: true });
  if (error) throw error;
}

export async function setDiscoveryVisible(visible) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('discovery_profiles')
    .update({ discovery_visible: visible })
    .eq('user_id', user.id);
  if (error) throw error;
}