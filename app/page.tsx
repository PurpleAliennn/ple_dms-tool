"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './Dashboard.module.css'; // Make sure to match your CSS naming

export default function DashboardPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [campaignName, setCampaignName] = useState("");

    // 1. Fetch campaigns on load
    useEffect(() => {
        const fetchCampaigns = async () => {
            const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
            if (data) setCampaigns(data);
        };
        fetchCampaigns();
    }, []);

    // 2. Handle creation
    const handleCreateCampaign = async () => {
        if (!campaignName) return;

        const { data, error } = await supabase
            .from('campaigns')
            .insert([{ name: campaignName }])
            .select()
            .single();

        if (data) {
            setCampaigns([data, ...campaigns]); // Add to the top of the list
            setCampaignName("");
            setIsModalOpen(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>My Campaigns</h1>
                <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
                    + New Campaign
                </button>
            </header>

            <div className={styles.campaignGrid}>
                {campaigns.map((camp) => (
                    <Link
                        key={camp.id}
                        href={{
                            pathname: `/campaign/${camp.id}`,
                            query: { name: camp.name } // Pass the name in the URL query
                        }}
                        className={styles.campaignCard}
                    >
                        <h3>{camp.name}</h3>
                    </Link>
                ))}
            </div>

            {/* Modal matching your existing app style */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>New Campaign</h3>
                        <input
                            className={styles.modalInput}
                            value={campaignName}
                            onChange={(e) => setCampaignName(e.target.value)}
                            placeholder="Campaign Name"
                        />
                        <div className={styles.modalButtons}>
                            <button className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button className={styles.confirmBtn} onClick={handleCreateCampaign}>Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}