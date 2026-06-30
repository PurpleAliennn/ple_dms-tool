import { supabase } from "@/lib/supabase";

export async function searchTargets(query: string, campaignId: string) {
  const [cardsResult, pagesResult] = await Promise.all([
    supabase
      .from('page_cards')
      .select(`
        id, 
        title, 
        type, 
        page_id,
        pages!inner(
            sections!inner(campaign_id)
        )
      `)
      .eq('pages.sections.campaign_id', campaignId) // This often fails
      .ilike('title', `%${query}%`),
      
    supabase
      .from('pages')
      .select(`id, label, sections!inner(campaign_id)`)
      .eq('sections.campaign_id', campaignId)
      .ilike('label', `%${query}%`)
  ]);

  // If cardsResult is empty but you expect data, log the error
  if (cardsResult.error) console.error("Cards Search Error:", cardsResult.error);
  
  return {
    cards: cardsResult.data || [],
    pages: pagesResult.data || []
  };
}