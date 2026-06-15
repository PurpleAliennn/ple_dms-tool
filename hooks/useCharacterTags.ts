import { useState, useEffect } from 'react';
import { addCardTag, removeTag, getTagsForCard } from '@/lib/tagService';

export const useCharacterTags = (cardId: string) => {
    // 1. Initialize as empty array. Don't rely on initialTags to prevent sync conflicts.
    const [tags, setTags] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchTags = async () => {
        setIsLoading(true);
        const data = await getTagsForCard(cardId);
        setTags(data || []);
        setIsLoading(false);
    };

    // 2. Fetch only once when the cardId changes
    useEffect(() => {
        if (cardId) fetchTags();
    }, [cardId]);

    const handleAdd = async (name: string) => {
        setIsLoading(true);
        try {
            await addCardTag(cardId, name);
            const freshTags = await getTagsForCard(cardId);

            // Use the functional updater pattern to ensure you are 
            // using the absolute latest, cleanest state
            setTags(() => [...freshTags]);
        } catch (err) {
            console.error("Error adding card tag:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async (tagId: string) => {
        setIsLoading(true);
        try {
            await removeTag('card_tags', 'card_id', cardId, tagId);
            await fetchTags();
        } catch (err) {
            console.error("Error removing tag:", err);
            setIsLoading(false);
        }
    };

    return { tags, handleAdd, handleRemove, isLoading };
};