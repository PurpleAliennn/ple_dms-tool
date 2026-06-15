"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./TextCard.module.css";
import { useCharacterTags } from "@/hooks/useCharacterTags";
import TagDisplay from "./TagDisplay";
import TagModal from "./TagModal";
import { getAllTags } from "@/lib/tagService";

interface Tag {
    id: string;
    name: string;
    campaign_id?: string;
}

export default function TextCard({
    id,
    initialData,
    onDelete,
    campaignId
}: {
    id: string,
    initialData: { text: string, title?: string, subtitle?: string },
    onDelete: (id: string) => void,
    campaignId: string
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(initialData.title || "");
    const [subtitle, setSubtitle] = useState(initialData.subtitle || "");
    const [text, setText] = useState(initialData.text || "");

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allAvailableTags, setAllAvailableTags] = useState<Tag[]>([]);

    const { tags, handleAdd, handleRemove } = useCharacterTags(id);

    const resizeTextarea = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    useEffect(() => {
        if (isModalOpen) {
            getAllTags(campaignId).then((tags) => setAllAvailableTags(tags as Tag[]));
        }
    }, [isModalOpen, campaignId]);

    useEffect(() => {
        if (isEditing) resizeTextarea();
    }, [isEditing]);

    const handleSave = async () => {
        await supabase
            .from('page_cards')
            .update({
                title: title,
                data: { text, title, subtitle }
            })
            .eq('id', id);
        setIsEditing(false);
    };

    return (
        <div id={`card-${id}`} className={styles.textCard}>
            <div className={styles.tagSection}>
                <TagDisplay
                    tags={tags.map(t => ({
                        id: t.tag_id,
                        label: t.tags?.name || t.tags?.label || "Unknown"
                    }))}
                    onAdd={() => setIsModalOpen(true)}
                    onRemove={(tagId) => handleRemove(tagId)}
                />
            </div>

            {isEditing ? (
                <div className={styles.editForm}>
                    <input
                        className={styles.titleInput}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title"
                    />
                    <input
                        className={styles.subtitleInput}
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Subtitle"
                    />
                    <textarea
                        ref={textareaRef}
                        className={styles.textarea}
                        value={text}
                        onChange={(e) => { setText(e.target.value); resizeTextarea(); }}
                        style={{ overflow: 'hidden' }}
                    />
                    <div className={styles.cardActions}>
                        <button className={styles.cancelBtn} onClick={() => { setIsEditing(false); setTitle(initialData.title || ""); setSubtitle(initialData.subtitle || ""); setText(initialData.text); }}>Cancel</button>
                        <button className={styles.deleteBtn} onClick={() => onDelete(id)}>Delete</button>
                        <button className={styles.saveBtn} onClick={handleSave}>Save</button>
                    </div>
                </div>
            ) : (
                <div className={styles.viewMode}>
                    {title && <h3 className={styles.cardTitle}>{title}</h3>}
                    {subtitle && <h4 className={styles.cardSubtitle}>{subtitle}</h4>}
                    <p>{text}</p>
                    <div className={styles.cardActions}>
                        <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                            <span>✎</span> Edit
                        </button>
                    </div>
                </div>
            )}

            <TagModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                allTags={allAvailableTags}
                setAllTags={setAllAvailableTags}
                campaignId={campaignId}
                onAdd={async (name) => {
                    await handleAdd(name);
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
}