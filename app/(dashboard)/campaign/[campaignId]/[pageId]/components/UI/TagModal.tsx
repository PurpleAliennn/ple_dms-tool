import { useState } from "react";
import styles from "./TagModal.module.css"

interface Tag { id: string; name: string; }

export default function TagModal({ isOpen, onClose, onAdd, allTags }: {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string) => void;
    allTags: Tag[];
}) {
    const [newTagName, setNewTagName] = useState("");

    if (!isOpen) return null;

    return (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                    <h3>Manage Tags</h3>


                    <div className="tag-list">
                        {allTags.map((t) => (
                            <button key={t.id} onClick={() => onAdd(t.name)}>
                                {t.name}
                            </button>
                        ))}
                    </div>

                    <input
                        placeholder="New tag name..."
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                    />

                    <div className="modal-actions">
                        <button onClick={onClose}>Cancel</button>
                        <button onClick={() => {
                            if (newTagName.trim()) {
                                onAdd(newTagName);
                                setNewTagName("");
                                onClose();
                            }
                        }}>Save Tag</button>
                    </div>
                </div>
            </div>
    );
}