import { useState, useEffect } from 'react';
import { addCardTag, removeTag, getTagsForCard } from '@/lib/tagService';

export const useCharacterTags = (cardId: string) => {
    const [tags, setTags] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchTags = async () => {
        setIsLoading(true);
        const data = await getTagsForCard(cardId);
        setTags(data || []);
        setIsLoading(false);
    };

    useEffect(() => {
        if (cardId) fetchTags();
    }, [cardId]);

    const handleAdd = async (name: string) => {
        setIsLoading(true);
        try {
            await addCardTag(cardId, name);
            const freshTags = await getTagsForCard(cardId);

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