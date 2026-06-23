"use client";

import { useEffect, useState, use, SetStateAction } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";
import TextCard from "./components/UI/TextCard";
import CharacterCard from "./components/UI/CharacterCard";
import TimelineCard from "./components/UI/TimelineCard"; // Ensure this path is correct
import { SortableContainer } from "./components/dnd/SortableContainer";
import TagModal from "./components/UI/TagModal";
import TagDisplay from "./components/UI/TagDisplay";
import { usePageTags } from "@/hooks/usePageTags";
import { getAllTags } from "@/lib/tagService";
import { useParams, useRouter } from "next/navigation";


interface CardProps {
  card: any;
  onDelete: (id: string) => void;
  campaignId: string;
  pageId: string;
  onNavigate: (id: string, type: 'card' | 'page') => void;
}

// Update the renderer to use the interface
const CardRenderer = ({ card, onDelete, campaignId, pageId, onNavigate }: CardProps) => {
  const commonProps = {
    id: card.id,
    initialData: card.data,
    onDelete,
    campaignId,
    pageId,
    // Change this to pass through both id and type
    onNavigate: (id: string, type: 'card' | 'page') => onNavigate(id, type),
  };

  switch (card.type) {
    case 'timeline':
      return (
        <TimelineCard
          {...commonProps}
          initialData={{
            title: card.title || "New Timeline",
            description: card.data?.description || ""
          }}
        />
      );
    case 'character':
      return <CharacterCard {...commonProps} />;
    default:
      return <TextCard {...commonProps} />;
  }
};

export default function DetailPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;
  const pageId = params.pageId as string;
  const router = useRouter();

  console.log("DetailPage loaded with pageId:", pageId);

  const [pageLabel, setPageLabel] = useState("Loading...");
  const [cards, setCards] = useState<any[]>([]);
  const [pageAvailableTags, setPageAvailableTags] = useState<any[]>([]);
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [isPageTagModalOpen, setIsPageTagModalOpen] = useState(false);

  const { tags: pageTags, handleAdd: addPageTag, handleRemove: removePageTag } = usePageTags(pageId);

  // Inside DetailPage.tsx
const handleNavigate = async (targetId: string, entityType: 'card' | 'page') => {
    console.log("DetailPage received navigate:", { targetId, entityType });

    if (entityType === 'page') {
        router.push(`/campaign/${campaignId}/${targetId}`);
        return;
    }

    const elementId = `card-${targetId}`;
    const element = document.getElementById(elementId);

    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // USE .maybeSingle() to stop the crash!
        const { data: cardData, error } = await supabase
            .from('page_cards')
            .select('page_id')
            .eq('id', targetId)
            .maybeSingle(); 

        if (error) {
            console.error("Supabase Error:", error);
            return;
        }

        if (!cardData) {
            console.error("Card lookup failed, ID likely a page:", targetId);
            // If we are here, it means we tried to find a card but couldn't.
            // DO NOT continue to push, as the URL will be invalid.
            return;
        }

        router.push(`/campaign/${campaignId}/${cardData.page_id}#${elementId}`);
    }
};

  useEffect(() => {
    if (!campaignId || !pageId || campaignId === "undefined" || pageId === "undefined") {
      return;
    }

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

  const createCard = async (type: 'text' | 'character' | 'timeline') => {
    const isChar = type === 'character';
    const isTimeline = type === 'timeline';

    const initialData = isChar
      ? { name: "Unnamed Character", class: "", race: "", hp: "", ac: "", imageUrl: "", str: 10, dex: 10, con: 10, wis: 10, int: 10, cha: 10 }
      : isTimeline
        ? { title: "New Timeline" }
        : { text: "New card...", title: "New Card", subtitle: "" };

    // 1. Create the card
    const { data: newCard, error: cardError } = await supabase
      .from('page_cards')
      .insert([{
        page_id: pageId,
        type: type,
        data: initialData,
        title: isChar ? "Unnamed Character" : isTimeline ? "New Timeline" : "New Card"
      }])
      .select()
      .single();

    if (cardError) {
      console.error("Error creating card:", cardError);
      return;
    }

    // 2. IMPORTANT: Index the card in the entities table
    if (newCard) {
      const { error: entityError } = await supabase
        .from('entities')
        .insert([{
          entity_type: 'card',
          reference_id: newCard.id
        }]);

      if (entityError) {
        console.error("Error creating entity link:", entityError);
      }

      // 3. Update state
      setCards([...cards, newCard]);
    }

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
            <CardRenderer
              key={card.id}
              card={card}
              onDelete={handleDelete}
              campaignId={campaignId}
              pageId={pageId}
              onNavigate={handleNavigate}
            />
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
            <button className={styles.modalButtonCard} onClick={() => createCard('text')}>Text Card</button>
            <button className={styles.modalButtonCard} onClick={() => createCard('character')}>Character Card</button>
            <button className={styles.modalButtonCard} onClick={() => createCard('timeline')}>Timeline Card</button>
            <button className={styles.modalButtonCancel} onClick={() => setIsNewCardModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>

  );
}
