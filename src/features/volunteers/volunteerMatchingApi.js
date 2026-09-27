import { supabase } from '../../lib/supabaseClient';

export async function fetchVolunteerNeedingEvents(regionId, gender) {
  const { data, error } = await supabase
    .from('public_events')
    .select('*')
    .eq('region_id', regionId)
    .eq('needs_volunteers', true)
    .in('gender_scope', gender ? ['all', gender] : ['all'])
    .gte('starts_at', new Date().toISOString())
    .order('starts_at');
  if (error) throw error;
  return data;
}

export async function fetchRegionalVolunteers(regionId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, region_id, interests, volunteer_contact')
    .eq('willing_volunteer', true)
    .eq('region_id', regionId);
  if (error) throw error;
  return data;
}

export async function optInAsVolunteer(contact) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('profiles')
    .update({ willing_volunteer: true, volunteer_contact: contact })
    .eq('id', user.id);
  if (error) throw error;
}