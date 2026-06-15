import { useState, useEffect } from 'react';
import { addPageTag, removePageTag, getTagsForPage } from '@/lib/tagService';

export const usePageTags = (pageId: string) => { // 1. Removed initialTags
    const [tags, setTags] = useState<any[]>([]); // 2. Start with an empty array
    const [isLoading, setIsLoading] = useState(false);

    const fetchTags = async () => {
        setIsLoading(true);
        const data = await getTagsForPage(pageId);
        setTags(data || []);
        setIsLoading(false);
    };

    useEffect(() => {
        if (pageId) fetchTags();
    }, [pageId]);

    const handleAdd = async (name: string) => {
        setIsLoading(true);
        await addPageTag(pageId, name);
        await fetchTags(); // 3. Simply refresh the full list from the DB
        setIsLoading(false);
    };

    const handleRemove = async (tagId: string) => {
        setIsLoading(true);
        try {
            await removePageTag(pageId, tagId);
            await fetchTags(); // 3. Simply refresh the full list from the DB
        } catch (error) {
            console.error("Error removing tag:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return { tags, handleAdd, handleRemove, isLoading };
};