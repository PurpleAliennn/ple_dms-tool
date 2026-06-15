import { useState, useEffect } from 'react';
import { addPageTag, removePageTag, getTagsForPage } from '@/lib/tagService';

export const usePageTags = (pageId: string) => {
    const [tags, setTags] = useState<any[]>([]);
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
        await fetchTags(); 
        setIsLoading(false);
    };

    const handleRemove = async (tagId: string) => {
        setIsLoading(true);
        try {
            await removePageTag(pageId, tagId);
            await fetchTags();
        } catch (error) {
            console.error("Error removing tag:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return { tags, handleAdd, handleRemove, isLoading };
};