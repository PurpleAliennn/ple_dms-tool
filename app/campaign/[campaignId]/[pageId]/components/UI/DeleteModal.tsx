import styles from '../../../../../Dashboard.module.css'

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
}

export default function DeleteModal({
    isOpen,
    onClose,
    onConfirm,
    itemName
}: DeleteModalProps) {

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h3>Delete {itemName}?</h3>
                <p>Are you sure you want to delete this campaign? This can't be reversed.</p>
                <div className="actions">
                    <button onClick={onClose}> Cancel </button>
                    <button onClick={onConfirm}> Delete </button>
                </div>
            </div>
        </div>
    );
}