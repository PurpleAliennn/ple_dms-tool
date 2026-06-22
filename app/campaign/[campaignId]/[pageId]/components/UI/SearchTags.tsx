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
    const campaignId = (params?.campaignId as string) || "";

    useEffect(() => {
        if (!campaignId || query.trim().length < 2) {
            setResults([]);
            return;
        }

        const handler = setTimeout(async () => {
            const data = await searchAllByTag(query.trim(), campaignId);
            setResults(data);
        }, 100);

        return () => clearTimeout(handler);
    }, [query, campaignId]);;

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
        console.log("Target ID:", item.type === 'page' ? `page-${item.id}` : `card-${item.id}`);
        setResults([]);
        setQuery("");

        const elementId = item.type === 'page' ? `page-${item.id}` : `card-${item.id}`;
        const element = document.getElementById(elementId);

        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add(styles.highlight);
            setTimeout(() => element.classList.remove(styles.highlight), 2000);
            console.log("Element found on current page!");
        } else {
            const targetPath = `/campaign/${campaignId}/${item.type === 'page' ? item.id : item.pageId}`;
            router.push(`${targetPath}?scrollTo=${elementId}`);
            console.log("Element not found, navigating to:", targetPath);
        }
    };

    const groupedResults = results.reduce((acc: any, item) => {
        console.log("Search Item Data:", item);

        const tagName = item.tagName;
        if (!acc[tagName]) acc[tagName] = [];
        acc[tagName].push(item);

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
                    {Object.entries(groupedResults).map(([tagName, items]: [string, any]) => (
                        <div key={tagName} className={styles.tagGroup}>
                            <h4 className={styles.tagHeader}>{tagName}</h4>

                            <ul className={styles.itemList}>
                                {items.map((item: any, idx: number) => (
                                    <li
                                        key={idx}
                                        onClick={() => handleNavigate(item)}
                                        className={styles.resultItem}
                                    >
                                        <span className={`${styles.itemBadge} ${styles[item.card_type]}`}>
                                            {item.card_type || item.type}
                                        </span>
                                        <span className={styles.itemTitle}>
                                            {item.type === 'page' ? item.pageLabel : item.cardTitle}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}