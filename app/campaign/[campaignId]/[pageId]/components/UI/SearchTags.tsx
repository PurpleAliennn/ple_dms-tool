"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { searchAllByTag } from "@/lib/tagService";
import styles from "./SearchTags.module.css";

export default function SearchTags() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);

    const params = useParams();
    const router = useRouter();
    const campaignId = params.campaignId as string;

    useEffect(() => {

        if (query.trim().length < 2) {
            setResults([]);
            return;
        }


        const handler = setTimeout(async () => {
            const data = await searchAllByTag(query.trim());
            setResults(data);
        }, 100);

        return () => clearTimeout(handler);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const container = document.querySelector(`.${styles.searchContainer}`);
            if (container && !(event.target as HTMLElement).closest(`.${styles.searchContainer}`)) {
                setResults([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigate = (item: any) => {
        setResults([]);
        setQuery("");

        const elementId = item.type === 'page' ? `page-${item.id}` : `card-${item.id}`;
        const element = document.getElementById(elementId);

        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add(styles.highlight);
            setTimeout(() => element.classList.remove(styles.highlight), 2000);
        } else {
            const targetPath = `/campaign/${campaignId}/${item.type === 'page' ? item.id : item.pageId}`;
            router.push(`${targetPath}?scrollTo=${elementId}`);
        }
    };

    const groupedResults = results.reduce((acc: any, item) => {
        const label = item.pageLabel || "Unassigned";
        if (!acc[label]) acc[label] = [];
        acc[label].push(item);
        return acc;
    }, {});

    return (
        <div className={styles.searchContainer}>
            <div className={`${styles.searchInputWrapper} ${results.length > 0 ? styles.hasResults : ''}`}>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="search..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {results.length > 0 && (
                <div className={styles.searchResultsList}>
                    {Object.entries(groupedResults).map(([pageLabel, items]: [string, any]) => (
                        <ul key={pageLabel} style={{ padding: '0 10px', margin: 0 }}>
                            {items.map((item: any, idx: number) => (
                                <li
                                    key={idx}
                                    onClick={() => handleNavigate(item)}
                                    className={styles.resultItem}
                                >
                                    {item.type === 'page' ? `Page: ${pageLabel}` : `Card: ${item.cardTitle}`}
                                </li>
                            ))}
                        </ul>
                    ))}
                </div>
            )}
        </div>
    );
}