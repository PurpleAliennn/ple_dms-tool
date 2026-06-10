import styles from './TagDisplay.module.css';

interface TagDisplayProps {
  tags: string[];
  onAdd: () => void;
  onRemove?: (tag: string) => void;
}

export default function TagDisplay({ tags, onAdd, onRemove }: { 
    tags: { id: string, label: string }[], 
    onAdd: () => void, 
    onRemove: (id: string) => void 
}) {
  return (
    <div className={styles.tagContainer}>
      <span className={styles.tagLabel}>Tags:</span>
      {tags.map((tag) => (
        <span key={tag.id} className={styles.tag}>
          {tag.label}
          <button className={styles.removeBtn} onClick={() => onRemove(tag.id)}>×</button>
        </span>
      ))}
      <button className={styles.addTagButton} onClick={onAdd}>+</button>
    </div>
  );
}