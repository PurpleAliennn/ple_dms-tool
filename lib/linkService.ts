import { supabase } from "./supabase";
import { EntityType } from "./entityService";

export const createCampaignLink = async (
  sourceId: string,
  targetEntityId: string,
  type: string,
  // Make selection optional
  selection?: { start: number; length: number },
  // Add linkedEventId as an optional string
  linkedEventId?: string
) => {
  const insertData: any = {
    source_entity_id: sourceId,
    target_entity_id: targetEntityId,
    link_type: type,
  };

  // If text selection is provided, add fragment data
  if (selection) {
    insertData.fragment_start = selection.start;
    insertData.fragment_length = selection.length;
  }

  // If an event ID is provided, add it
  if (linkedEventId) {
    insertData.linked_event_id = linkedEventId;
  }

  const { data, error } = await supabase
    .from('campaign_links')
    .insert([insertData]);

  if (error) {
    console.error("DEBUG: Supabase INSERT Error:", error);
    throw error;
  }

  return data;
};