import { useState, useEffect } from 'react';
import { addCardTag, removeTag, getTagsForCard } from '@/lib/tagService';

export const useCharacterTags = (cardId: string, initialTags: any[]) => {
    const [tags, setTags] = useState(initialTags);
    const [isLoading, setIsLoading] = useState(false); // Added state

    const handleAdd = async (name: string) => {
        setIsLoading(true);
        try {
            // Call the specialized function
            await addCardTag(cardId, name);
            const freshTags = await getTagsForCard(cardId);
            setTags(freshTags);
        } catch (err) {
            console.error("Error adding card tag:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTags = async () => {
        setIsLoading(true);
        const data = await getTagsForCard(cardId);
        setTags(data || []);
        setIsLoading(false);
    };

    // This handles the initial load on page refresh
    useEffect(() => {
        fetchTags();
    }, [cardId]);

    const handleRemove = async (tagId: string) => {
        setIsLoading(true); // Set loading
        await removeTag('card_tags', 'card_id', cardId, tagId);
        const freshTags = await getTagsForCard(cardId);
        setTags(freshTags);
        setIsLoading(false); // Reset loading
    };

    return { tags, handleAdd, handleRemove, isLoading }; // Returned isLoading
};