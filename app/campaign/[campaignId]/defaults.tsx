import { MenuSection } from './data';

export const DEFAULT_SECTIONS: MenuSection[] = [
  {
    id: 'world',
    title: 'World',
    subSections: [
      { id: 'settlements', label: 'Settlements' },
      { id: 'guilds', label: 'Guilds' }
    ]
  },
  {
    id: 'characters',
    title: 'Characters',
    subSections: [
      { id: 'npcs', label: 'NPCs' },
      { id: 'party', label: 'Party' }
    ]
  }
];