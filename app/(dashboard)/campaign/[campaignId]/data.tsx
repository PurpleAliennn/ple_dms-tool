export interface SubSection {
  id: string;
  label: string;
}

export interface MenuSection {
  id: string;
  title: string;
  subSections: SubSection[];
}