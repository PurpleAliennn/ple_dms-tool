import { supabase } from "@/lib/supabase";

// 1. Fetch the base card (works for ALL types)
export const getCardById = async (cardId: string) => {
  const { data, error } = await supabase
    .from('page_cards')
    .select('*')
    .eq('id', cardId)
    .single();

  if (error) throw error;
  return data;
};

// 2. Fetch specific timeline events
export const getTimelineEvents = async (cardId: string) => {
  const { data, error } = await supabase
    .from('timeline_events')
    .select('*')
    .eq('card_id', cardId)
    .order('sort_order', { ascending: true });

  if (error) return [];
  return data;
};

// 3. Orchestrator: This is the "magic" function you call in your component
export const getFullTimelineCard = async (cardId: string) => {
  const [card, events] = await Promise.all([
    getCardById(cardId),
    getTimelineEvents(cardId)
  ]);
  
  return { ...card, events };
};