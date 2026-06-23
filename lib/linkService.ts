import { supabase } from "./supabase";
import { EntityType } from "./entityService";

export const createCampaignLink = async (
  sourceId: string, 
  targetEntityId: string, 
  type: string, 
  selection: { start: number, length: number }
) => {
  console.log("DEBUG: Sending to Supabase:", { sourceId, targetEntityId, type, selection });
  
  const { data, error } = await supabase
    .from('campaign_links')
    .insert([{
      source_entity_id: sourceId,
      target_entity_id: targetEntityId,
      link_type: type,
      fragment_start: selection.start,
      fragment_length: selection.length
    }]);

  if (error) {
    console.error("DEBUG: Supabase INSERT Error:", error);
    throw error;
  }
  
  console.log("DEBUG: Success!");
  return data;
};