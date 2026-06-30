"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, handleLogout } from '@/lib/supabase';
import styles from './Dashboard.module.css';
import DeleteModal from './campaign/[campaignId]/[pageId]/components/UI/DeleteModal';
import { createClient } from '@/utils/supabase/client';
import { deleteUserAccount } from '@/app/actions/auth'; // Ensure this is imported

export default function DashboardPage() {
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [campaignName, setCampaignName] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleDeleteAccount = async (userId: string) => {
        if (window.confirm("WARNING: This will permanently delete your account and all your data. This cannot be undone. Are you sure?")) {
            try {
                await deleteUserAccount(userId);
                window.location.href = '/login';
            } catch (err) {
                console.error("Delete failed", err);
                alert("Failed to delete account.");
            }
        }
    };

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data } = await supabase
                    .from('campaigns')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                if (data) setCampaigns(data);
            }
        };
        checkUser();
    }, []);

    useEffect(() => {
        const fetchCampaigns = async () => {
            const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
            if (data) setCampaigns(data);
        };
        fetchCampaigns();
    }, []);

    const handleCreateCampaign = async () => {
        if (!campaignName || !user) return; // Ensure user is available

        const { data, error } = await supabase
            .from('campaigns')
            .insert([{
                name: campaignName,
                user_id: user.id // <--- THIS IS THE FIX
            }])
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
            window.location.reload();
        }
    };

    if (!user) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>Lorechives</h1>
                    <Link href="/login" className={styles.loginButton}>Log In</Link>
                </header>
                <div className={styles.emptyState}>
                    <h2>Welcome to Lorechives</h2>
                    <p>Please log in to view your campaigns.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Lorechives</h1>
                <div className={styles.accountMgmt}>
                    <button
                        className={styles.userIcon}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        Account
                    </button>

                    {isDropdownOpen && (
                        <div className={styles.dropdownMenu}>
                            <button
                                onClick={handleLogout}
                                className={styles.dropdownItem}
                            >
                                Logout
                            </button>
                            <button
                                onClick={() => user && handleDeleteAccount(user.id)}
                                className={`${styles.dropdownItem} ${styles.deleteItem}`}
                            >
                                Delete Account
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className={styles.campaignGrid}>
                <h1> My campaigns </h1>
                <div className={styles.campaigns}>
                    {campaigns.map((camp) => (
                        <div key={camp.id} className={styles.campaignCardWrapper} style={{ position: 'relative' }}>
                            <Link href={`/campaign/${camp.id}`} className={styles.campaignCard}>
                                <h3>{camp.name}</h3>
                            </Link>

                            <button
                                className={styles.deleteBtn}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCampaignToDelete(camp.id);
                                    setIsDeleteModalOpen(true);
                                }}
                            >
                                🗑
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
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button className={styles.createBtn} onClick={handleCreateCampaign}>Create</button>
                        </div>
                    </div>
                </div>
            )}

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