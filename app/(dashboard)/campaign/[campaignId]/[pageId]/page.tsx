"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css"; // Import the new styles
import TextCard from "./components/TextCard";

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

  const createCard = async (type: 'text') => {
    const { data, error } = await supabase
      .from('page_cards')
      .insert([{ page_id: pageId, type: type, data: { text: "New card..." } }])
      .select()
      .single();

    if (data) {
      setCards([...cards, data]); // Appends the new card to your existing list
    }
  };

  const handleDelete = async (id: string) => {
    // Call Supabase to delete the row from the database
    const { error } = await supabase
      .from('page_cards')
      .delete()
      .eq('id', id);

    if (!error) {
      // If successful in DB, update local state to remove the card from the UI
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
        {/* 3. MAP AND RENDER CARDS */}
        {cards.map((card) => (
          <TextCard
            key={card.id}
            id={card.id}
            initialData={card.data}
            onDelete={handleDelete}
          />
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