import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ReactNode } from 'react'; // 1. Added import for ReactNode
import { SortableItem } from './SortableItem';

interface SortableContainerProps {
  items: any[]; 
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  renderItem: (item: any) => ReactNode;
}

// 2. Explicitly tell the function to use the interface
export function SortableContainer({ items, setItems, renderItem }: SortableContainerProps) {
  
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    // 3. Safety check: ensure 'over' exists (if you drop outside)
    if (!over) return; 

    if (active.id !== over.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((i) => i.id === active.id);
        const newIndex = prevItems.findIndex((i) => i.id === over.id);
        return arrayMove(prevItems, oldIndex, newIndex);
      });
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableItem key={item.id} id={item.id}>
            {renderItem(item)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}