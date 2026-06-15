"use client";

import { useEffect, useState, use, SetStateAction } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";
import TextCard from "./components/UI/TextCard";
import CharacterCard from "./components/UI/CharacterCard";
import { SortableContainer } from "./components/dnd/SortableContainer";
import TagModal from "./components/UI/TagModal";
import TagDisplay from "./components/UI/TagDisplay";
import { usePageTags } from "@/hooks/usePageTags";
import { getAllTags } from "@/lib/tagService";

export default function DetailPage({ params }: { params: Promise<{ campaignId: string, pageId: string }> }) {
  // Unwrapping the params Promise safely
  const resolvedParams = use(params);
  const { campaignId, pageId } = resolvedParams;

  const [pageLabel, setPageLabel] = useState("Loading...");
  const [cards, setCards] = useState<any[]>([]);
  const [pageAvailableTags, setPageAvailableTags] = useState<any[]>([]);

  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [isPageTagModalOpen, setIsPageTagModalOpen] = useState(false);

  const { tags: pageTags, handleAdd: addPageTag, handleRemove: removePageTag } = usePageTags(pageId);

  useEffect(() => {
    if (!campaignId || !pageId) return;

    const fetchInitialData = async () => {

      const { data: pageData, error: pageError } = await supabase
        .from('pages')
        .select('label, section_id')
        .eq('id', pageId)
        .single();

      if (pageError || !pageData) {
        setPageLabel("Page Not Found");
        return;
      }

      const { data: sectionData, error: sectionError } = await supabase
        .from('sections')
        .select('campaign_id')
        .eq('id', pageData.section_id)
        .single();

      console.log("URL Campaign ID:", campaignId);
      console.log("Database Campaign ID:", sectionData?.campaign_id);

      if (sectionError || sectionData?.campaign_id !== campaignId) {
        setPageLabel("Access Denied: Page does not belong to this campaign");
        return;
      }
      setPageLabel(pageData.label);

      const { data: cardData } = await supabase
        .from('page_cards')
        .select('*')
        .eq('page_id', pageId)
        .order('order_index');

      if (cardData) setCards(cardData);
    };

    fetchInitialData();
  }, [pageId, campaignId]);

  const openPageTagModal = async () => {
    const tags = await getAllTags(campaignId);
    setPageAvailableTags(tags);
    setIsPageTagModalOpen(true);
  };

  const createCard = async (type: 'text' | 'character') => {
    const isChar = type === 'character';
    const initialData = isChar
      ? { name: "Unnamed Character", class: "", race: "", hp: "", ac: "", imageUrl: "", str: 10, dex: 10, con: 10, wis: 10, int: 10, cha: 10 }
      : { text: "New card...", title: "New Card", subtitle: "" };

    const { data } = await supabase
      .from('page_cards')
      .insert([{
        page_id: pageId,
        type: type,
        data: initialData,
        title: isChar ? "Unnamed Character" : "New Card"
      }])
      .select()
      .single();

    if (data) setCards([...cards, data]);
    setIsNewCardModalOpen(false);
  };

  const handleCardsChange = async (action: SetStateAction<any[]>) => {
    const newCards = typeof action === 'function' ? action(cards) : action;
    setCards(newCards);

    const updates = newCards.map((card, index) => ({
      id: card.id,
      order_index: index
    }));

    await supabase.from('page_cards').upsert(updates);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('page_cards').delete().eq('id', id);
    setCards(cards.filter((card) => card.id !== id));
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{pageLabel}</h1>
        <TagDisplay
          tags={pageTags.map(t => ({
            id: t.tag_id,
            label: t.tags?.name || t.tags?.label || "Unknown"
          }))}
          onAdd={openPageTagModal}
          onRemove={(tagId) => removePageTag(tagId)}
        />
      </header>

      <div className={styles.content}>
        <SortableContainer
          items={cards}
          setItems={handleCardsChange}
          renderItem={(card) => (
            card.type === 'character' ? (
              <CharacterCard key={card.id} id={card.id} initialData={card.data} onDelete={handleDelete} campaignId={campaignId} />
            ) : (
              <TextCard key={card.id} id={card.id} initialData={card.data} onDelete={handleDelete} campaignId={campaignId} />
            )
          )}
        />
        <button className={styles.addButton} onClick={() => setIsNewCardModalOpen(true)}>+ Add New Card</button>
      </div>

      <TagModal
        isOpen={isPageTagModalOpen}
        onClose={() => setIsPageTagModalOpen(false)}
        allTags={pageAvailableTags}
        setAllTags={setPageAvailableTags}
        onAdd={async (name) => {
          await addPageTag(name);
          setIsPageTagModalOpen(false);
        }}
        campaignId={campaignId}
      />

      {isNewCardModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Add a New Card</h3>
            <button onClick={() => createCard('text')}>Text Card</button>
            <button onClick={() => createCard('character')}>Character Card</button>
            <button onClick={() => setIsNewCardModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}