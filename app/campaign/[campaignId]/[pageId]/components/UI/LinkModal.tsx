"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./LinkModal.module.css"; // Ensure this matches your CSS file

export default function LinkModal({ isOpen, onClose, onLinkSelected, campaignId }: any) {
    const [search, setSearch] = useState("");
    const [allResults, setAllResults] = useState<any[]>([]);
    const [filteredResults, setFilteredResults] = useState<any[]>([]);

    useEffect(() => {
        if (!isOpen) return;

        const fetchTargets = async () => {
            // Fetch Cards and Pages
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

            // Ensure we handle potential nulls from Supabase
            const cards = Array.isArray(cardsRes.data) ? cardsRes.data : [];
            const pages = Array.isArray(pagesRes.data) ? pagesRes.data : [];

            // Map safely
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

// "use client";
// import { useState, useEffect } from "react";
// import { supabase } from "@/lib/supabase";

// interface PageCard {
//     id: string;
//     title?: string; // Optional because some might be null
//     data: {
//         title?: string;
//         name?: string;
//         description?: string;
//     };
// }

// export default function LinkModal({ isOpen, onClose, onLinkSelected }: any) {
//     const [search, setSearch] = useState("");
//     const [allResults, setAllResults] = useState<any[]>([]);
//     const [filteredResults, setFilteredResults] = useState<any[]>([]);

//     // 1. Fetch data ONLY when the modal opens
//     useEffect(() => {
//         if (!isOpen) return;

//         const fetchEntities = async () => {
//             const { data: cards } = await supabase
//                 .from('page_cards')
//                 .select('id, title, data') as { data: PageCard[] | null };
//             const { data: entities } = await supabase.from('entities').select('*');

//             if (!cards || !entities) return;

//             const uniqueResults = new Map();
//             entities.forEach(ent => {
//                 const card = cards.find(c => c.id === ent.reference_id) as any;
//                 if (card) {
//                     uniqueResults.set(ent.reference_id, {
//                         id: ent.reference_id, // This MUST be the ID from page_cards
//                         title: card.title || card.data?.title || card.data?.name || "Untitled"
//                     });
//                 }
//             });

//             setAllResults(Array.from(uniqueResults.values()));
//         };

//         fetchEntities();
//     }, [isOpen]);

//     // 2. Filter locally as you type (Instant performance)
//     useEffect(() => {
//         if (search.length < 2) {
//             setFilteredResults([]);
//         } else {
//             const filtered = allResults.filter(res =>
//                 res.title.toLowerCase().includes(search.toLowerCase())
//             );
//             setFilteredResults(filtered);
//         }
//     }, [search, allResults]);

//     if (!isOpen) return null;

//     return (
//         <div className="modal-overlay">
//             <div className="modal-content">
//                 <h3>Link to Card</h3>
//                 <input
//                     autoFocus
//                     placeholder="Type to search..."
//                     value={search}
//                     onChange={(e) => setSearch(e.target.value)}
//                 />

//                 <div className="results-list">
//                     {filteredResults.map((res: any) => (
//                         <div
//                             key={res.id}
//                             className="result-item"
//                             onClick={() => onLinkSelected(res.id, res.title)}
//                         >
//                             {res.title}
//                         </div>
//                     ))}
//                     {search.length >= 2 && filteredResults.length === 0 && (
//                         <div>No cards found.</div>
//                     )}
//                 </div>

//                 <button onClick={onClose}>Cancel</button>
//             </div>
//         </div>
//     );
// }