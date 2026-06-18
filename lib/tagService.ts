import { supabase } from "@/lib/supabase";
export const addPageTag = async (pageId: string, tagName: string) => {
    const { data: tag } = await supabase.from('tags').select('id').eq('name', tagName).single();
    if (!tag) return;

    const { data: existing } = await supabase
        .from('page_tags')
        .select('id')
        .eq('page_id', pageId)
        .eq('tag_id', tag.id);

    if (existing && existing.length > 0) {
        console.warn("Tag already exists on this page");
        return; 
    }

    await supabase.from('page_tags').insert({ page_id: pageId, tag_id: tag.id });
};

export const addCardTag = async (cardId: string, tagName: string) => {
  const { data: tag, error: tagError } = await supabase
    .from('tags')
    .select('id')
    .eq('name', tagName)
    .single();

  if (tagError || !tag) return;

  const { data: existing } = await supabase
    .from('card_tags')
    .select('id')
    .eq('card_id', cardId)
    .eq('tag_id', tag.id);

  if (existing && existing.length > 0) {
    console.warn("Tag already exists on this card.");
    return;
  }

  await supabase.from('card_tags').insert({ card_id: cardId, tag_id: tag.id });
};

export const removeTag = async (table: string, foreignKeyColumn: string, id: string, tagId: string) => {
  await supabase
    .from(table)
    .delete()
    .eq(foreignKeyColumn, id)
    .eq('tag_id', tagId);
};

export const getTagsForCard = async (cardId: string) => {
  const { data, error } = await supabase
    .from('card_tags')
    .select(`
      tag_id,
      tags (
        id,
        name
      )
    `)
    .eq('card_id', cardId);

  if (error) {
    console.error("Supabase Query Error:", error);
    return [];
  }

  console.log("Raw data from Supabase:", data);
  return data || [];
};

export const getAllTags = async (campaignId: string) => {
    if (!campaignId) return [];

    const { data, error } = await supabase
        .from('tags')
        .select('id, name, campaign_id')
        .or(`campaign_id.eq.${campaignId},campaign_id.is.null`);
    
    if (error) {
        console.error("Error fetching tags:", error.message);
        return [];
    }
    return data || [];
};

export const removePageTag = async (pageId: string, tagId: string) => {
  await supabase
    .from('page_tags')
    .delete()
    .eq('page_id', pageId)
    .eq('tag_id', tagId);
};

export const getTagsForPage = async (pageId: string) => {
  const { data, error } = await supabase
    .from('page_tags')
    .select(`
      tag_id,
      tags (
        id,
        name
      )
    `)
    .eq('page_id', pageId);

  if (error) return [];
  return data?.filter((item) => item.tags !== null) || [];
};

interface TagResult {
  tags: { name: string } | { name: string }[];
  page_id?: string;
  card_id?: string;
}

export const searchAllByTag = async (tagName: string, campaignId: string) => {
  const { data: tagMatches, error: tagError } = await supabase
    .from('tags')
    .select('id, name')
    .ilike('name', `%${tagName}%`)
    .or(`campaign_id.eq.${campaignId},campaign_id.is.null`);

  if (tagError || !tagMatches || tagMatches.length === 0) return [];

  const tagIds = tagMatches.map(t => t.id);
  const tagMap = new Map(tagMatches.map(t => [t.id, t.name]));

  const { data: pageResults } = await supabase
    .from('page_tags')
    .select(`
      page_id, 
      tag_id, 
      pages!inner(id, label, sections!inner(campaign_id))
    `)
    .in('tag_id', tagIds)
    .eq('pages.sections.campaign_id', campaignId);

  const { data: cardResults } = await supabase
    .from('card_tags')
    .select(`
      card_id, 
      tag_id, 
      page_cards!inner(id, page_id, title, pages!inner(sections!inner(campaign_id)))
    `)
    .in('tag_id', tagIds)
    .eq('page_cards.pages.sections.campaign_id', campaignId);

  const cardIds = cardResults?.map(c => c.card_id) || [];
  const { data: cardToPageLinks } = await supabase
    .from('page_cards')
    .select('id, page_id, title')
    .in('id', cardIds);

  const pageIds = new Set([
    ...(pageResults?.map(p => p.page_id) || []),
    ...(cardToPageLinks?.map(c => c.page_id) || [])
  ].filter(Boolean) as string[]);

  const { data: allPages } = await supabase
    .from('pages')
    .select('id, label')
    .in('id', Array.from(pageIds));

  const pageLabelMap = new Map(allPages?.map(p => [p.id, p.label]));

  return [
    ...(pageResults || []).map(p => ({
      type: 'page' as const,
      id: p.page_id,
      tagName: tagMap.get(p.tag_id),
      pageLabel: pageLabelMap.get(p.page_id) || "Untitled Page"
    })),
    ...(cardResults || []).map(c => {
      const cardInfo = cardToPageLinks?.find(link => link.id === c.card_id);
      const parentPageId = cardInfo?.page_id;

      return {
        type: 'card' as const,
        id: c.card_id,
        tagName: tagMap.get(c.tag_id),
        cardTitle: cardInfo?.title || "Untitled Card",
        pageId: parentPageId,
        pageLabel: pageLabelMap.get(parentPageId) || "Untitled Page"
      };
    })
  ];
};