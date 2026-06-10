import { useState, useEffect } from 'react';
import { addPageTag, removePageTag, getTagsForPage } from '@/lib/tagService';

export const usePageTags = (pageId: string, initialTags: any[]) => {
    const [tags, setTags] = useState(initialTags);
    const [isLoading, setIsLoading] = useState(false);

    const handleAdd = async (name: string) => {
        setIsLoading(true);
        // Use the specific function that knows about page_id
        await addPageTag(pageId, name);
        const freshTags = await getTagsForPage(pageId);
        setTags(freshTags);
        setIsLoading(false);
    };

    const fetchTags = async () => {
        setIsLoading(true);
        const data = await getTagsForPage(pageId);
        setTags(data || []);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTags();
    }, [pageId]);

    const handleRemove = async (tagId: string) => {
        setIsLoading(true);
        try {
            await removePageTag(pageId, tagId);
            const freshTags = await getTagsForPage(pageId);
            setTags(freshTags);
        } catch (error) {
            console.error("FAILED to remove tag. Supabase Error Details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return { tags, handleAdd, handleRemove, isLoading };
};