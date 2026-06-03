"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./TextCard.module.css"

export default function TextCard({ id, initialData, onDelete }: {
    id: string,
    initialData: { text: string },
    onDelete: (id: string) => void
}) {

    console.log("Styles object:", styles);
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(initialData.text);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const resizeTextarea = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    useEffect(() => {
        if (isEditing) resizeTextarea();
    }, [isEditing]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        resizeTextarea(); // 5. Resize while typing
    };

    const handleSave = async () => {
        await supabase
            .from('page_cards')
            .update({ data: { text } })
            .eq('id', id);
        setIsEditing(false);
    };

    return (
        <div className={styles.textCard}>
            {isEditing ? (
                <div>
                    <textarea
                        ref={textareaRef}
                        className={styles.textarea}
                        value={text}
                        onChange={handleInput}
                        style={{ overflow: 'hidden' }}
                    />
                    <div className={styles.cardActions}>
                        <button className={styles.cancelBtn} onClick={() => { setIsEditing(false); setText(initialData.text); }}>Cancel</button>
                        <button className={styles.deleteBtn} onClick={() => onDelete(id)}>Delete</button>
                        <button className={styles.saveBtn} onClick={handleSave}>Save</button>
                    </div>
                </div>
            ) : (
                <div>
                    <p>{text}</p>
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