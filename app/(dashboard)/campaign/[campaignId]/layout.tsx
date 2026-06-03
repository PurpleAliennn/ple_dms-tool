"use client";

import React, { useState, use, useEffect } from 'react';
import Link from 'next/link';
import styles from './layout.module.css';
import { supabase } from '../../../../lib/supabase';

export default function CampaignLayout({
  children,
  params: paramsPromise
}: {
  children: React.ReactNode,
  params: Promise<{ campaignId: string }>
}) {
  const { campaignId } = use(paramsPromise);

  const [sections, setSections] = useState<any[]>([]);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ type: 'category' | 'page', sectionId?: string }>({ type: 'category' });
  const [inputValue, setInputValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'section' | 'page', id: string, sectionId?: string } | null>(null);

//database communication
  useEffect(() => {
    const fetchSidebarData = async () => {
      const { data, error } = await supabase
        .from('sections')
        .select(`
            id,
            label,
            pages (id, label)
          `);

      if (data) {

        const formatted = data.map(section => ({
          id: section.id,
          title: section.label,
          subSections: (section.pages || []).map((p: any) => ({
            id: p.id,
            label: p.label
          }))
        }));
        setSections(formatted);

        const worldSection = formatted.find(s => s.title === 'World');
        if (worldSection) setOpenSection(worldSection.id);
      }
    };
    fetchSidebarData();
  }, []);

  const toggle = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const addSection = async (title: string) => {
    if (!title) return;
    const { data, error } = await supabase
      .from('sections')
      .insert([{ label: title }])
      .select()
      .single();

    if (data) {
      setSections([...sections, { id: data.id, title: data.label, subSections: [] }]);
    }
  };

  const addSubSection = async (sectionId: string, label: string) => {
    if (!label) return;
    const { data, error } = await supabase
      .from('pages')
      .insert([{ section_id: sectionId, label: label }])
      .select()
      .single();

    if (data) {
      setSections(sections.map(sec => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            subSections: [...sec.subSections, { id: data.id, label: data.label }]
          };
        }
        return sec;
      }));
    }
  };

  const confirmDeleteSection = (id: string) => {
    setDeleteTarget({ type: 'section', id });
    setIsModalOpen(true);
  };

  const confirmDeletePage = (id: string, sectionId: string) => {
    setDeleteTarget({ type: 'page', id, sectionId });
    setIsModalOpen(true);
  };

  const deleteSection = async (sectionId: string) => {
    const { error } = await supabase.from('sections').delete().eq('id', sectionId);
    if (!error) setSections(sections.filter(s => s.id !== sectionId));
  };

  const deletePage = async (pageId: string, sectionId: string) => {
    const { error } = await supabase.from('pages').delete().eq('id', pageId);
    if (!error) {
      setSections(sections.map(sec => sec.id === sectionId ?
        { ...sec, subSections: sec.subSections.filter((p: any) => p.id !== pageId) } : sec));
    }
  };

//pop up handlers
  const handleOpenModal = (type: 'category' | 'page', sectionId?: string) => {
    setModalConfig({ type, sectionId });
    setInputValue("");
    setIsModalOpen(true);
  };

  const handleModalSubmit = () => {
    if (modalConfig.type === 'category') {
      addSection(inputValue);
    } else if (modalConfig.type === 'page' && modalConfig.sectionId) {
      addSubSection(modalConfig.sectionId, inputValue);
    }
    setIsModalOpen(false);
  };

  return (
    <div className={styles.appWrapper}>
      <header className={styles.mainHeader}>
        <h1>[{campaignId}]</h1>
      </header>

      <div className={styles.favoritesBar}>
        <span className={styles.star}>★</span>
        <button className={styles.favBadge}>Settlements</button>
      </div>

      <div className={styles.bodyLayout}>
        <aside className={styles.sidebar}>

          {/* handles what's in the sidebar */}
          {sections.map((section) => (
            <div key={section.id} className={styles.card}>
              <div className={styles.sidebarRow}>
                <button onClick={() => toggle(section.id)} className={styles.cardHeader}>
                  <span>{openSection === section.id ? '∨' : '❯'}</span> {section.title}
                </button>
                <button onClick={() => confirmDeleteSection(section.id)} className={styles.trashBtn}>🗑</button>
              </div>

              {openSection === section.id && (
                <div className={styles.cardBody}>
                  {section.subSections.map((sub: any) => (
                    <div key={sub.id} className={styles.sidebarRow}>
                      <Link
                        href={`/campaign/${campaignId}/${sub.id}`}
                        className={styles.subItem}
                      >
                        {sub.label}
                      </Link>
                      <button onClick={() => confirmDeletePage(sub.id, section.id)} className={styles.trashBtnSmall}>×</button>
                    </div>
                  ))}
                  <button className={styles.addPageBtn} onClick={() => handleOpenModal('page', section.id)}>
                    + Add Page
                  </button>
                </div>
              )}
            </div>
          ))}

          <button className={styles.addCategoryBtn} onClick={() => handleOpenModal('category')}>
            + New Category
          </button>
        </aside>
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>

      {/* what happens when the pop-up is opened */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {deleteTarget ? (
              <>
                <h3>Delete {deleteTarget.type}?</h3>
                <p>This action cannot be undone.</p>
                <div className={styles.modalButtons}>
                  <button className={styles.cancelBtn} onClick={() => { setIsModalOpen(false); setDeleteTarget(null); }}>Cancel</button>
                  <button className={styles.deleteBtn} onClick={async () => {
                    if (deleteTarget.type === 'section') await deleteSection(deleteTarget.id);
                    else await deletePage(deleteTarget.id, deleteTarget.sectionId!);
                    setIsModalOpen(false);
                    setDeleteTarget(null);
                  }}>Delete</button>
                </div>
              </>
            ) : (
              <>
                <h3>{modalConfig.type === 'category' ? 'New Category' : 'New Page'}</h3>
                <input className={styles.modalInput} value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                <div className={styles.modalButtons}>
                  <button onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                  <button onClick={handleModalSubmit} className={styles.confirmBtn}>Create</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}