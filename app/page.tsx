"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './Dashboard.module.css';
import DeleteModal from './campaign/[campaignId]/[pageId]/components/UI/DeleteModal';

export default function DashboardPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [campaignName, setCampaignName] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

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
                        <div key={camp.id} className={styles.campaignCardWrapper} style={{ position: 'relative' }}>
                            <Link href={`/campaign/${camp.id}`} className={styles.campaignCard}>
                                <h3>{camp.name}</h3>
                            </Link>

                            <button
                                className={styles.deleteBtn}
                                onClick={(e) => {
                                    e.preventDefault(); // Prevents navigating to the campaign
                                    setCampaignToDelete(camp.id);
                                    setIsDeleteModalOpen(true);
                                }}
                            >
                                Delete
                            </button>
                        </div>
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
                        />
                        <button onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button onClick={handleCreateCampaign}>Create</button>
                    </div>
                </div>
            )}

            {/* DELETE MODAL (using the DeleteModal component) */}
            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={async () => {
                    if (campaignToDelete) {
                        await deleteCampaign(campaignToDelete);
                        setIsDeleteModalOpen(false);
                    }
                }}
                itemName="this campaign"
            />
        </div>


    );
}