import { supabase } from "./supabase";

export type EntityType = 'page' | 'card' | 'event';
/**
 * Gets the entity ID for a reference, or creates it if it doesn't exist.
 */
export async function getOrRegisterEntity(type: 'card' | 'page', refId: string) {
    // 1. Check if it exists
    const { data: existing } = await supabase
        .from('entities')
        .select('id')
        .eq('reference_id', refId)
        .eq('entity_type', type) // Ensure we match the type!
        .single();
    
    if (existing) return existing.id;

    // 2. Create if missing
    const { data: newEntity, error } = await supabase
        .from('entities')
        .insert([{ entity_type: type, reference_id: refId }])
        .select()
        .single();
        
    if (error) throw error;
    return newEntity.id;
}

/**
 * Utility to resolve an entity back to its actual data
 */
export const resolveEntity = async (entityId: string) => {
  const { data: entity } = await supabase
    .from('entities')
    .select('*')
    .eq('id', entityId)
    .maybeSingle();

  if (!entity) return null;

  // Resolve based on type
  let table = "";
  if (entity.entity_type === 'card') table = 'page_cards';
  if (entity.entity_type === 'page') table = 'pages';
  if (entity.entity_type === 'event') table = 'timeline_events';

  const { data } = await supabase
    .from(table)
    .select('*')
    .eq('id', entity.reference_id)
    .maybeSingle();

  return { ...data, type: entity.entity_type };
};