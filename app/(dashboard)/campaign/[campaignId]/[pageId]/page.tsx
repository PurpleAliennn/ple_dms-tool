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

export default function DetailPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = use(params);
  const [pageLabel, setPageLabel] = useState("Loading...");
  const [cards, setCards] = useState<any[]>([]);
  const [pageAvailableTags, setPageAvailableTags] = useState<any[]>([]);

  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [isPageTagModalOpen, setIsPageTagModalOpen] = useState(false);

  const { tags: pageTags, handleAdd: addPageTag, handleRemove: removePageTag } = usePageTags(pageId, []);

  const createCard = async (type: 'text' | 'character') => {
    const isChar = type === 'character';
    const initialData = isChar 
      ? { name: "Unnamed Character", class: "", race: "", hp: "", ac: "", imageUrl: "", str: 10, dex: 10, con: 10, wis: 10, int: 10, cha: 10 } 
      : { text: "New card...", title: "New Card", subtitle: "" };
      
    const defaultTitle = isChar ? "Unnamed Character" : "New Card";

    const { data } = await supabase
      .from('page_cards')
      .insert([{ 
          page_id: pageId, 
          type: type, 
          data: initialData, 
          title: defaultTitle 
      }])
      .select()
      .single();
      
    if (data) setCards([...cards, data]);
    setIsNewCardModalOpen(false);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: pageData } = await supabase.from('pages').select('label').eq('id', pageId).single();
      setPageLabel(pageData?.label || "Page Not Found");

      const { data: cardData } = await supabase.from('page_cards').select('*').eq('page_id', pageId).order('order_index');
      if (cardData) setCards(cardData);
    };
    fetchInitialData();
  }, [pageId]);

  const openPageTagModal = async () => {
    const tags = await getAllTags();
    setPageAvailableTags(tags);
    setIsPageTagModalOpen(true);
  };

  const handleCardsChange = (action: SetStateAction<any[]>) => {
    const newCards = typeof action === 'function' ? action(cards) : action;
    setCards(newCards);
    const updates = newCards.map((card, index) => ({ id: card.id, order_index: index }));
    supabase.from('page_cards').upsert(updates);
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
              <CharacterCard key={card.id} id={card.id} initialData={card.data} onDelete={handleDelete} />
            ) : (
              <TextCard key={card.id} id={card.id} initialData={card.data} onDelete={handleDelete} />
            )
          )}
        />
        <button className={styles.addButton} onClick={() => setIsNewCardModalOpen(true)}>+ Add New Card</button>
      </div>

      <TagModal
        isOpen={isPageTagModalOpen}
        onClose={() => setIsPageTagModalOpen(false)}
        allTags={pageAvailableTags}
        onAdd={async (name) => {
          await addPageTag(name);
          setIsPageTagModalOpen(false);
        }}
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