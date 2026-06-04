"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";
import TextCard from "./components/UI/TextCard";
import CharacterCard from "./components/UI/CharacterCard";

export default function DetailPage({ params: paramsPromise }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = use(paramsPromise);
  const [pageLabel, setPageLabel] = useState("Loading...");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    const fetchPageName = async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('label')
        .eq('id', pageId)
        .single();

      if (data) {
        setPageLabel(data.label);
      } else {
        setPageLabel("Page Not Found");
      }

      const { data: cardData } = await supabase
        .from('page_cards')
        .select('*')
        .eq('page_id', pageId)
        .order('order_index', { ascending: true });

      if (cardData) setCards(cardData);

    };

    fetchPageName();
  }, [pageId]);

  const createCard = async (type: 'text' | 'character') => {
  const initialData = type === 'character' 
    ? { 
        name: "", 
        class: "", 
        race: "", 
        hp: "", 
        ac: "", 
        imageUrl: "", 
        str: 10, dex: 10, con: 10, wis: 10, int: 10, cha: 10 
      }
    : { text: "New card..." };

    const { data, error } = await supabase
    .from('page_cards')
    .insert([{ page_id: pageId, type: type, data: initialData }])
    .select()
    .single();

    if (data) {
    setCards([...cards, data]);
  } else if (error) {
    console.error("Error creating card:", error);
  }
};

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('page_cards')
      .delete()
      .eq('id', id);

    if (!error) {
      setCards(cards.filter((card) => card.id !== id));
    } else {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{pageLabel}</h1>
      </header>

      <div className={styles.content}>
        {cards.map((card) => (
          card.type === 'character' ? (
            <CharacterCard
              key={card.id}
              id={card.id}
              initialData={card.data}
              onDelete={handleDelete}
            />
          ) : (
            <TextCard
              key={card.id}
              id={card.id}
              initialData={card.data}
              onDelete={handleDelete}
            />
          )
        ))}
        <div className={styles.controls}>
          <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
            + Add New Card
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Add a New Card</h3>

            <button
              className={styles.modalButtonTextCard}
              onClick={() => {
                createCard('text');
                setIsModalOpen(false);
              }}
            >
              Text Card
            </button>

            <button onClick={() => {
              createCard('character');
              setIsModalOpen(false);
            }}
            >
              Create Character Card
            </button>

            <button
              className={styles.modalButtonCancel}
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>

  );
}