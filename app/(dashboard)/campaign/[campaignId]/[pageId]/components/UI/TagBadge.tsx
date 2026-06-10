export default function TagBadge({ tags, onRemove }: { tags: any[], onRemove: (id: string) => void }) {

  return (
    <div className="tag-container">
      {tags.map((ct) => {
        if (!ct.tags) return null; 

        return (
          <span key={ct.tags.id} className="tag-badge">
            {ct.tags.name}
            <button onClick={() => onRemove(ct.tags.id)}>×</button>
          </span>
        );
      })}
    </div>
  );
}