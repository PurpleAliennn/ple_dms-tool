"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./CharacterCard.module.css";

export default function CharacterCard({ id, initialData, onDelete }: { id: string, initialData: any, onDelete: (id: string) => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [data, setData] = useState(initialData);

    const handleUpdate = (field: string, value: string | number) => {
        setData({ ...data, [field]: value });
    };

    const handleSave = async () => {
        await supabase.from('page_cards').update({ data }).eq('id', id);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setData(initialData); // Reverts the data to the last saved state
        setIsEditing(false);  // Closes the edit form
    };

    return (
        <div className={styles.characterCard}>
            {isEditing ? (
                <div className={styles.editForm}>
                    {/* Header Section: Image + Basic Details */}

                    <div className={styles.headerRow}>

                        <div className={styles.detailsInputs}>
                            <label>Image URL:</label>
                            <input value={data.imageUrl || ""} onChange={(e) => handleUpdate('imageUrl', e.target.value)} placeholder="URL" />

                            <label>Name:</label>
                            <input value={data.name || ""} onChange={(e) => handleUpdate('name', e.target.value)} placeholder="Name" />

                            <div className={styles.inputField}>
                                <label>Level:</label>
                                <select
                                    value={data.level || ""}
                                    onChange={(e) => handleUpdate('level', e.target.value === "" ? "" : parseInt(e.target.value))}
                                >
                                    <option value="">Select Level</option>
                                    {/* Generates numbers 1 through 20 */}
                                    {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                                        <option key={lvl} value={lvl}>
                                            Level {lvl}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <label className={styles.labelWithPipe}>
                                Class + Subclass <span className={styles.pipeSpace}>|</span> Race
                            </label>
                            <div className={styles.inlineInputs}>
                                <input value={data.class || ""} onChange={(e) => handleUpdate('class', e.target.value)} placeholder="Class" />
                                <input value={data.race || ""} onChange={(e) => handleUpdate('race', e.target.value)} placeholder="Race" />
                            </div>

                            <label>HP <span className={styles.pipeSpace}>|</span> AC:</label>
                            <div className={styles.inlineInputs}>
                                <input type="number" value={data.hp || ""} onChange={(e) => handleUpdate('hp', parseInt(e.target.value))} placeholder="HP" />
                                <input type="number" value={data.ac || ""} onChange={(e) => handleUpdate('ac', parseInt(e.target.value))} placeholder="AC" />
                            </div>
                        </div>
                    </div>

                    <p className={styles.statsGridTitle}> Stats: </p>

                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                        {['str', 'dex', 'con', 'wis', 'int', 'cha'].map(stat => (
                            <div key={stat} className={styles.inputGroup}>
                                {/* Value (Input) is now on top */}
                                <input
                                    type="number"
                                    value={data[stat] || 10}
                                    onChange={(e) => handleUpdate(stat, parseInt(e.target.value))}
                                    className={styles.statInput} // Added class for specific styling
                                />
                                {/* Label is now on bottom */}
                                <label>{stat.toUpperCase()}</label>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.cardActions}>
                        <button className={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
                        <button className={styles.deleteBtn} onClick={() => onDelete(id)}>Delete</button>
                        <button className={styles.saveBtn} onClick={handleSave}>Save</button>
                    </div>
                </div>
            ) : (
                <div className={styles.viewMode}>
                    <div className={styles.headerRow}>
                        {/* Optional: Add an image display here if you want */}
                        {data.imageUrl && <img src={data.imageUrl} alt="Character" className={styles.charImage} />}

                        <div>
                            <h3 className={styles.headerName}>
                                {data.name || "Unnamed Character"}
                                <span className={styles.headerDetails}>
                                    <span className={styles.separator}>|</span>
                                    {data.class || "Class"} {data.level ? `Lvl ${data.level}` : ""}
                                    <span className={styles.separator}>|</span>
                                    {data.race || "Race"}
                                </span>
                            </h3>

                            {/* ADD THIS: The Vital Stats display */}
                            <div className={styles.vitalStats}>
                                <p>HP: <strong>{data.hp || "--"}</strong></p>
                                <p>AC: <strong>{data.ac || "--"}</strong></p>
                            </div>
                        </div>
                    </div>
                    <div className={styles.statsGrid}>
                        {['str', 'dex', 'con', 'wis', 'int', 'cha'].map(stat => (
                            <div key={stat} className={styles.statBox}>
                                <div className={styles.mod}>+{Math.floor(((data[stat] || 10) - 10) / 2)}</div>
                                <div className={styles.score}>{data[stat] || "--"}</div>
                                <div className={styles.label}>{stat}</div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.cardActions}>
                        <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                            <span>✎</span> Edit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}