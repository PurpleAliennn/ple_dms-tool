"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./CharacterCard.module.css";
import { useCharacterTags } from "@/hooks/useCharacterTags";
import TagDisplay from "./TagDisplay";
import TagModal from "./TagModal";
import { getAllTags } from "@/lib/tagService";

interface Tag {
    id: string;
    name: string;
    campaign_id?: string;
}

export default function CharacterCard({
    id,
    initialData,
    onDelete,
    campaignId 
}: {
    id: string;
    initialData: any;
    onDelete: (id: string) => void;
    campaignId: string;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [data, setData] = useState(initialData);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allAvailableTags, setAllAvailableTags] = useState<Tag[]>([]);

    const { tags, handleAdd, handleRemove } = useCharacterTags(id);

    useEffect(() => {
        if (isModalOpen) {
            getAllTags(campaignId).then((tags) => {
                console.log("Tags fetched for modal:", tags);
                setAllAvailableTags(tags as Tag[]);
            });
        }
    }, [isModalOpen, campaignId]);

    const handleUpdate = (field: string, value: string | number) => {
        setData({ ...data, [field]: value });
    };

    const handleSave = async () => {
        const updatedData = { ...data, title: data.name };

        const { error } = await supabase
            .from('page_cards')
            .update({
                title: data.name,
                data: updatedData
            })
            .eq('id', id);

        if (!error) {
            setData(updatedData);
            setIsEditing(false);
        } else {
            console.error("Save error:", error);
        }
    };

    return (
        <div id={`card-${id}`} className={styles.characterCard}>
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
                    <div className={styles.detailsInputs}>
                        <label>Name:</label>
                        <input value={data.name || ""} onChange={(e) => handleUpdate('name', e.target.value)} placeholder="Name" />
                        <label>Image URL:</label>
                        <input value={data.imageUrl || ""} onChange={(e) => handleUpdate('imageUrl', e.target.value)} placeholder="Image URL" />
                    </div>

                    <div className={styles.inlineInputs}>
                        <div className={styles.inlineInputGroupHpAc}>
                            <div className={styles.inputField}>
                                <label>HP:</label>
                                <input type="number" value={data.hp || ""} onChange={(e) => handleUpdate('hp', parseInt(e.target.value))} placeholder="HP" />
                            </div>
                            <div className={styles.inputField}>
                                <label>AC:</label>
                                <input type="number" value={data.ac || ""} onChange={(e) => handleUpdate('ac', parseInt(e.target.value))} placeholder="AC" />
                            </div>
                        </div>

                        <label className={styles.labelWithPipe}>
                            Class + Subclass <span className={styles.pipeSpace}>|</span> Race
                        </label>

                        <div className={styles.inlineInputGroup}>
                            <input value={data.class || ""} onChange={(e) => handleUpdate('class', e.target.value)} placeholder="Class" />
                            <input value={data.race || ""} onChange={(e) => handleUpdate('race', e.target.value)} placeholder="Race" />
                        </div>
                    </div>

                    <div className={styles.inputField}>
                        <label>Level:</label>
                        <select value={data.level || ""} onChange={(e) => handleUpdate('level', e.target.value === "" ? "" : parseInt(e.target.value))}>
                            <option value="">Select Level</option>
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                                <option key={lvl} value={lvl}>Level {lvl}</option>
                            ))}
                        </select>
                    </div>

                    <h3 className={styles.statsGridTitle}>Stats:</h3>
                    <div className={styles.statsGrid}>
                        {['str', 'dex', 'con', 'wis', 'int', 'cha'].map(stat => (
                            <div key={stat} className={styles.inputGroup}>
                                <input type="number" value={data[stat] || 10} onChange={(e) => handleUpdate(stat, parseInt(e.target.value))} className={styles.statInput} />
                                <label>{stat.toUpperCase()}</label>
                            </div>
                        ))}
                    </div>

                    <div className={styles.cardActions}>
                        <button className={styles.cancelBtn} onClick={() => { setData(initialData); setIsEditing(false); }}>Cancel</button>
                        <button className={styles.deleteBtn} onClick={() => onDelete(id)}>Delete</button>
                        <button className={styles.saveBtn} onClick={handleSave}>Save</button>
                    </div>
                </div>
            ) : (
                <div className={styles.viewMode}>
                    <div className={styles.headerRow}>
                        {data.imageUrl && <img src={data.imageUrl} alt="Character" className={styles.charImage} />}
                        <div className={styles.textColumn}>
                            <h3 className={styles.headerName}>
                                <span className={styles.headerDetails}>
                                    {[data.name || "Unnamed Character", `${data.class || "Class"} Lvl ${data.level || "--"}`, data.race || "Race"].map((item, index, array) => (
                                        <span key={index} className={styles.detailWrapper}>
                                            <span className={index === 0 ? styles.boldName : styles.detailItem}>{item}</span>
                                            {index < array.length - 1 && <span className={styles.separator}>|</span>}
                                        </span>
                                    ))}
                                </span>
                            </h3>
                            <div className={styles.vitalStats}>
                                <p style={{ margin: '0' }}>HP: <strong>{data.hp || "--"}</strong></p>
                                <p style={{ margin: '0' }}>AC: <strong>{data.ac || "--"}</strong></p>
                            </div>
                        </div>
                    </div>
                    <div className={styles.statsGrid}>
                        {['str', 'dex', 'con', 'wis', 'int', 'cha'].map(stat => (
                            <div key={stat} className={styles.statBox}>
                                <div className={styles.mod}>+{Math.floor(((Number(data[stat]) || 10) - 10) / 2)}</div>
                                <div className={styles.score}>{data[stat] || "--"}</div>
                                <div className={styles.label}>{stat}</div>
                            </div>
                        ))}
                    </div>
                    <button className={styles.editBtn} onClick={() => setIsEditing(true)}>✎ Edit</button>
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