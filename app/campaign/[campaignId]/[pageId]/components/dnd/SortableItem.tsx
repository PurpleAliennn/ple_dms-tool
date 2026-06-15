import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode } from 'react';
import styles from './SortableItem.module.css';

interface SortableItemProps {
    id: string | number;
    children: ReactNode;
}

export function SortableItem({ id, children }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={styles.wrapper}
        >
            <div className={styles.dragHandle} {...attributes} {...listeners}>
                ⠿
            </div>

            <div className={styles.content}>
                {children}
            </div>
        </div>
    );
}