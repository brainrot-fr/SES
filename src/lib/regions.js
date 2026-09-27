import { supabase } from './supabaseClient';

export async function getMyRegionId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('region_id, gender').eq('id', user.id).single();
  return data;
}