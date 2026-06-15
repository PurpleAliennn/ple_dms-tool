"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [campaignName, setCampaignName] = useState("");

    useEffect(() => {
        const fetchCampaigns = async () => {
            const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
            if (data) setCampaigns(data);
        };
        fetchCampaigns();
    }, []);

    const handleCreateCampaign = async () => {
        if (!campaignName) return;

        const { data, error } = await supabase
            .from('campaigns')
            .insert([{ name: campaignName }])
            .select()
            .single();

        if (data) {
            setCampaigns([data, ...campaigns]);
            setCampaignName("");
            setIsModalOpen(false);
        }
    };

    const deleteCampaign = async (campaignId: string) => {
        const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', campaignId);

        if (error) {
            console.error("Error deleting campaign:", error);
            alert("Failed to delete campaign.");
        } else {
            // Refresh your state or redirect
            window.location.reload();
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>My Campaigns</h1>
            </header>

            <div className={styles.campaignGrid}>
                <div className={styles.campaigns}>
                    {campaigns.map((camp) => (
                        <Link
                            key={camp.id}
                            href={{
                                pathname: `/campaign/${camp.id}`,
                                query: { name: camp.name }
                            }}
                            className={styles.campaignCard}
                        >
                            <h3>{camp.name}</h3>
                        </Link>
                    ))}
                </div>
                <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
                    + New Campaign
                </button>
            </div>

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