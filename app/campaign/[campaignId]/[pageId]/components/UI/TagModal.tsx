"use client";
import { useState } from "react";
import styles from "./TagModal.module.css";
import { supabase } from "@/lib/supabase";

interface Tag {
    id: string;
    name: string;
    campaign_id?: string;
}

type OnAddHandler = (name: string) => void;

interface TagModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: OnAddHandler;
    allTags: Tag[];
    setAllTags: React.Dispatch<React.SetStateAction<Tag[]>>;
    campaignId: string;
}

export default function TagModal({
    isOpen,
    onClose,
    onAdd,
    allTags,
    setAllTags,
    campaignId
}: TagModalProps) {
    const [newTagName, setNewTagName] = useState("");

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;

        const { data, error } = await supabase
            .from('tags')
            .upsert(
                { name: newTagName, campaign_id: campaignId },
                { onConflict: 'name' }
            )
            .select()
            .single();

        if (!error && data) {
            setAllTags([...allTags.filter(t => t.name !== newTagName), data]);
            setNewTagName("");
        } else {
            console.error("Error saving tag:", error);
        }
    };

    const deleteTag = async (tagId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const { error } = await supabase.from('tags').delete().eq('id', tagId);

        if (!error) {
            setAllTags(allTags.filter(t => t.id !== tagId));
        } else {
            console.error("Error deleting tag:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h3>Manage Tags</h3>
                <div className={styles.tagList}>
                    {allTags.map((t) => (
                        <div key={t.id} className={styles.tagRow}>
                            <button className={styles.tagBtn} onClick={() => onAdd(t.name)}>
                                {t.name}
                                <span
                                    className={styles.deleteBtn}
                                    onClick={(e) => {
                                        e.stopPropagation(); // CRITICAL: Prevents the button click
                                        deleteTag(t.id, e);
                                    }}
                                >
                                    ×
                                </span>
                            </button>

                        </div>
                    ))}
                </div>

                <input
                    placeholder="New tag name..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                />

                <div className={styles.modalActions}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button className={styles.saveBtn} onClick={handleCreateTag}>Save Tag</button>
                </div>
            </div>
        </div>
    );
}