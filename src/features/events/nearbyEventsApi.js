import { supabase } from '../../lib/supabaseClient';

export async function fetchNearbyEvents(regionId, gender) {
  const { data, error } = await supabase
    .from('public_events')
    .select('*')
    .eq('region_id', regionId)
    .in('gender_scope', gender ? ['all', gender] : ['all'])
    .gte('starts_at', new Date().toISOString())
    .order('starts_at');
  if (error) throw error;
  return data;
}

export async function createEvent(payload) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('public_events')
    .insert({ ...payload, organizer_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}