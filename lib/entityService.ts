import { supabase } from "./supabase";

export type EntityType = 'page' | 'card' | 'event';
/**
 * Gets the entity ID for a reference, or creates it if it doesn't exist.
 */
export async function getOrRegisterEntity(type: 'card' | 'page', refId: string) {
    // 1. Try to find it
    const { data: existing } = await supabase
        .from('entities')
        .select('id')
        .eq('reference_id', refId)
        .eq('entity_type', type)
        .maybeSingle(); // Use maybeSingle() to avoid errors if null
    
    if (existing) return existing.id;

    // 2. Create it
    const { data, error } = await supabase
        .from('entities')
        .insert([{ entity_type: type, reference_id: refId }])
        .select('id') // Only select the ID to minimize overhead
        .single();
        
    if (error) {
        console.error("Entity creation failed:", error);
        throw error;
    }
    return data.id;
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