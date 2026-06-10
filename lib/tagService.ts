import { supabase } from "@/lib/supabase";

export const addPageTag = async (pageId: string, name: string) => {
  try {
    // 1. Get/Create the tag
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .upsert({ name: name.trim().toLowerCase() }, { onConflict: 'name' })
      .select('id')
      .single();

    if (tagError) throw tagError;

    // 2. Insert into page_tags (Specific to page_id)
    const { error: insertError } = await supabase.from('page_tags').upsert({
      page_id: pageId,
      tag_id: tag.id
    }, { onConflict: 'page_id, tag_id' }); // Use page_id here!

    if (insertError) throw insertError;
  } catch (err) {
    console.error("DEBUG: addPageTag failed:", err);
  }
};

export const addCardTag = async (cardId: string, name: string) => {
  try {
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .upsert({ name: name.trim().toLowerCase() }, { onConflict: 'name' })
      .select('id')
      .single();

    if (tagError) throw tagError;

    const { error: insertError } = await supabase.from('card_tags').upsert({
      card_id: cardId,
      tag_id: tag.id
    }, { onConflict: 'card_id, tag_id' });

    if (insertError) throw insertError;
  } catch (err) {
    console.error("DEBUG: addCardTag failed:", err);
  }
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

  console.log("Raw data from Supabase:", data); // Check if this matches your expectation
  return data || [];
};

export const getAllTags = async () => {
  const { data } = await supabase.from('tags').select('id, name');
  return data || [];
};

export const removePageTag = async (pageId: string, tagId: string) => {
  await supabase
    .from('page_tags')
    .delete()
    .eq('page_id', pageId)
    .eq('tag_id', tagId); // Deleting by both keys
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

export const searchAllByTag = async (tagName: string) => {
  // 1. Fetch tags that match the search string
  const { data: tagMatches } = await supabase
    .from('tags')
    .select('id, name')
    .ilike('name', `%${tagName}%`);

  if (!tagMatches || tagMatches.length === 0) return [];

  const tagIds = tagMatches.map(t => t.id);
  const tagMap = new Map(tagMatches.map(t => [t.id, t.name]));

  // 2. Fetch Page tags
  const { data: pageResults } = await supabase
    .from('page_tags')
    .select('page_id, tag_id, pages(id, label)')
    .in('tag_id', tagIds);

  // 3. Fetch Card tags
  const { data: cardResults } = await supabase
    .from('card_tags')
    .select('card_id, tag_id')
    .in('tag_id', tagIds);

  // 4. Fetch page_id from 'page_cards' for the found cards
  const cardIds = cardResults?.map(c => c.card_id) || [];
  const { data: cardToPageLinks } = await supabase
    .from('page_cards')
    .select('id, page_id, title') // Added 'title' here!
    .in('id', cardIds);

  const cardToPageMap = new Map(cardToPageLinks?.map(c => [c.id, c.page_id]));

  // 5. Collect all unique page IDs to fetch their labels
  const pageIds = new Set([
    ...(pageResults?.map(p => p.page_id) || []),
    ...(cardToPageLinks?.map(c => c.page_id) || [])
  ].filter(Boolean));

  const { data: allPages } = await supabase
    .from('pages')
    .select('id, label')
    .in('id', Array.from(pageIds));

  const pageLabelMap = new Map(allPages?.map(p => [p.id, p.label]));

  // 6. Assemble the final array
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
        cardTitle: cardInfo?.title || "Untitled Card", // Fetching the title
        pageId: parentPageId,
        pageLabel: pageLabelMap.get(parentPageId) || "Untitled Page"
      };
    })
  ];
};