"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./LinkModal.module.css";

export default function LinkModal({ isOpen, onClose, onLinkSelected, campaignId }: any) {
    const [search, setSearch] = useState("");
    const [allResults, setAllResults] = useState<any[]>([]);
    const [filteredResults, setFilteredResults] = useState<any[]>([]);

    useEffect(() => {
        if (!isOpen) return;

        const fetchTargets = async () => {

            const [cardsRes, pagesRes] = await Promise.all([
                supabase
                    .from('page_cards')
                    .select(`
                id, title, data, type, 
                pages!inner(sections!inner(campaign_id))
            `)
                    .eq('pages.sections.campaign_id', campaignId),
                supabase
                    .from('pages')
                    .select(`
                id, label, 
                sections!inner(campaign_id)
            `)
                    .eq('sections.campaign_id', campaignId)
            ]);

            const cards = Array.isArray(cardsRes.data) ? cardsRes.data : [];
            const pages = Array.isArray(pagesRes.data) ? pagesRes.data : [];

            const unified = [
                ...cards.map((c: any) => ({
                    id: c.id,
                    display: c.title || c.data?.title || c.data?.name || "Untitled",
                    type: (c.type || 'text').toUpperCase()
                })),
                ...pages.map((p: any) => ({
                    id: p.id,
                    display: p.label,
                    type: 'PAGE'
                }))
            ];

            setAllResults(unified);
        };

        fetchTargets();
    }, [isOpen]);

    useEffect(() => {
        if (search.length < 2) {
            setFilteredResults([]);
        } else {
            const filtered = allResults.filter(res =>
                res.display.toLowerCase().includes(search.toLowerCase())
            );
            setFilteredResults(filtered);
        }
    }, [search, allResults]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Link to Target</h3>
                <input
                    autoFocus
                    placeholder="Type to search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className={styles.resultsList}>
                    {filteredResults.map((res: any) => (
                        <div
                            key={`${res.type}-${res.id}`}
                            className={styles.resultItem}
                            // Ensure the order matches: (ID, TYPE)
                            onClick={() => onLinkSelected(res.id, res.type)}
                        >
                            <span className={`${styles.itemBadge} ${styles[res.type.toLowerCase()]}`}>
                                {res.type}
                            </span>
                            <span className={styles.itemTitle}>
                                {res.display}
                            </span>
                        </div>
                    ))}
                    {search.length >= 2 && filteredResults.length === 0 && (
                        <div>No results found.</div>
                    )}
                </div>

                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
}
