"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./TextCard.module.css";
import { useCharacterTags } from "@/hooks/useCharacterTags";
import TagDisplay from "./TagDisplay";
import TagModal from "./TagModal";
import LinkModal from "./LinkModal";
import { getOrRegisterEntity } from "@/lib/entityService";
import { createCampaignLink } from "@/lib/linkService";
import React from 'react';

interface Tag {
    id: string;
    name: string;
    campaign_id?: string;
}

interface TextCardProps {
    id: string;
    initialData: any;
    onDelete: (id: string) => void;
    campaignId: string;
    pageId: string;
    onNavigate: (id: string, type: 'card' | 'page') => void;
}

export default function TextCard({
    id,
    initialData,
    onDelete,
    campaignId,
    pageId,
    onNavigate // <--- ADD THIS
}: TextCardProps) {

    console.log("TextCard Rendered for ID:", id);

    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(initialData.title || "");
    const [subtitle, setSubtitle] = useState(initialData.subtitle || "");
    const [text, setText] = useState(initialData.text || "");
    const [inlineLinks, setInlineLinks] = useState<any[]>([]);

    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [allAvailableTags, setAllAvailableTags] = useState<Tag[]>([]);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [selection, setSelection] = useState<{ start: number, length: number } | null>(null);

    const { tags, handleAdd, handleRemove } = useCharacterTags(id);

    useEffect(() => {
        if (!isEditing) {
            const loadData = async () => {
                const entityId = await getOrRegisterEntity('card', id);
                const { data } = await supabase
                    .from('campaign_links')
                    .select(`
                    *, 
                    target_entity:entities!target_entity_id(
                        reference_id, 
                        entity_type
                    )
                `)
                    .eq('source_entity_id', entityId)
                    .eq('link_type', 'inline');
                setInlineLinks(data || []);
            };
            loadData();
        }
    }, [isEditing, id]);

    useEffect(() => {
        const fetchAllTags = async () => {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .eq('campaign_id', campaignId);

            if (data) {
                setAllAvailableTags(data);
            }
        };

        if (isTagModalOpen) {
            fetchAllTags();
        }
    }, [isTagModalOpen, campaignId]);

    const handleSave = async () => {
        await supabase.from('page_cards').update({ title, data: { text, title, subtitle } }).eq('id', id);
        setIsEditing(false);
    };

    const deleteLink = async (linkId: string) => {
        try {
            const { error } = await supabase
                .from('campaign_links')
                .delete()
                .eq('id', linkId);

            if (error) throw error;

            // Update local state to remove the link from the UI
            setInlineLinks(inlineLinks.filter(l => l.id !== linkId));
        } catch (err) {
            console.error("Error deleting link:", err);
            alert("Failed to delete link.");
        }
    };

    const handleLinkClick = (e: React.MouseEvent, targetRefId: string, entityType: 'card' | 'page') => {
        e.stopPropagation();
        console.log("Navigating to:", targetRefId, "Type:", entityType);

        // This MUST match the signature: (id: string, type: 'card' | 'page') => void
        onNavigate(targetRefId, entityType);
    };

    const renderText = () => {
        if (inlineLinks.length === 0) return <p>{text}</p>;
        const sorted = [...inlineLinks].sort((a, b) => a.fragment_start - b.fragment_start);

        const parts: React.ReactNode[] = [];
        let lastIdx = 0;

        sorted.forEach((link, i) => {
            if (!link.target_entity) return;
            parts.push(<span key={`text-${i}`}>{text.slice(lastIdx, link.fragment_start)}</span>);
            parts.push(
                <span
                    key={link.id}
                    className={styles.inlineLink}
                    onClick={(e) => {
                        if (link.target_entity?.reference_id) {
                            // DEBUG: See what the DB actually returned
                            console.log("Raw link object from DB:", link);

                            // USE THE FIELD DIRECTLY
                            const rawType = link.target_entity.entity_type;
                            const targetId = link.target_entity.reference_id;

                            // Ensure we handle 'page' vs 'card' explicitly
                            const finalType = (rawType === 'page') ? 'page' : 'card';

                            console.log("Determined Navigation Type:", finalType);
                            handleLinkClick(e, targetId, finalType);
                        }
                    }}
                >
                    {text.slice(link.fragment_start, link.fragment_start + link.fragment_length)}
                </span>
            );
            lastIdx = link.fragment_start + link.fragment_length;
        });

        parts.push(<span key="final">{text.slice(lastIdx)}</span>);
        return <p>{parts}</p>;
    };

    return (
        <div id={`card-${id}`} className={styles.textCard}>
            <div className={styles.tagSection}>
                <TagDisplay
                    tags={tags.map((t: any) => ({
                        id: t.tag_id,
                        label: t.tags?.name || t.tags?.label || "Unknown"
                    }))}
                    onAdd={() => {
                        console.log("Add Tag button clicked!");
                        setIsTagModalOpen(true)
                    }
                    }
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
                        className={styles.textarea}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onMouseUp={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            setSelection({ start: target.selectionStart, length: target.selectionEnd - target.selectionStart });
                        }}
                    />

                    <div className={styles.linkManager}>
                        <h4>Existing Links:</h4>
                        {inlineLinks.length === 0 ? <p>No links yet.</p> : (
                            <ul>
                                {inlineLinks.map((link) => (
                                    <li key={link.id}>
                                        {text.slice(link.fragment_start, link.fragment_start + link.fragment_length)}
                                        <button onClick={() => deleteLink(link.id)}>Delete</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <button
                        onMouseDown={async (e) => {
                            e.preventDefault();
                            if (selection && selection.length > 0) {
                                setIsLinkModalOpen(true);
                            } else {
                                alert("Please highlight text first!");
                            }
                        }}
                    >
                        Add Link to Selection
                    </button>
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
                    {renderText()}
                    <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                        <span>✎</span> Edit
                    </button>
                </div>
            )}

            <TagModal
                isOpen={isTagModalOpen}
                onClose={() => setIsTagModalOpen(false)}
                allTags={allAvailableTags}
                setAllTags={setAllAvailableTags}
                campaignId={campaignId}
                onAdd={async (name) => {
                    await handleAdd(name);
                    setIsTagModalOpen(false);
                }}
            />

            <LinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                campaignId={campaignId} // Don't forget to pass this!
                onLinkSelected={async (targetId: string, targetType: string) => {
                    if (!selection || !targetId) return;

                    try {
                        if (targetType === 'PAGE') {
                            // Handle Page Linking
                            const sourceId = await getOrRegisterEntity('card', id);
                            const targetEntityId = await getOrRegisterEntity('page', targetId);
                            await createCampaignLink(sourceId, targetEntityId, 'inline', selection);
                        } else {
                            // Handle Card Linking (Existing logic)
                            const sourceId = await getOrRegisterEntity('card', id);
                            const targetEntityId = await getOrRegisterEntity('card', targetId);
                            await createCampaignLink(sourceId, targetEntityId, 'inline', selection);
                        }

                        setIsLinkModalOpen(false);
                        setIsEditing(false); // Refresh view
                    } catch (err) {
                        console.error("Link creation failed:", err);
                        alert("Database error: Could not create link.");
                    }
                }}
            />
        </div>
    );
}
