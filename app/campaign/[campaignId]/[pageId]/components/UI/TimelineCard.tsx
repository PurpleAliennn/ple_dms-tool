"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getFullTimelineCard } from "@/lib/cardService";
import { getAllTags } from "@/lib/tagService";
import { useCharacterTags } from "@/hooks/useCharacterTags";
import TagDisplay from "./TagDisplay";
import TagModal from "./TagModal";
import styles from "./Timeline.module.css";

interface Tag { id: string; name: string; }

export default function TimelineCard({ id, onDelete, campaignId, initialData }: { id: string, onDelete: (id: string) => void, campaignId: string, initialData: { title: string, description: string } }) {
    const [events, setEvents] = useState<any[]>([]);
    const [isEditingCard, setIsEditingCard] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [title, setTitle] = useState(initialData.title || "");
    const [description, setDescription] = useState(initialData.description || "");
    const [tempData, setTempData] = useState({ title: initialData.title, description: initialData.description });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allAvailableTags, setAllAvailableTags] = useState<Tag[]>([]);
    const { tags, handleAdd, handleRemove } = useCharacterTags(id);

    const sortEvents = (arr: any[]) => {
        return [...arr].sort((a, b) => {
            const valA = a.event_date?.trim() === "" ? Infinity : (parseInt(a.event_date) || 0);
            const valB = b.event_date?.trim() === "" ? Infinity : (parseInt(b.event_date) || 0);
            return valA - valB;
        });
    };

    useEffect(() => {
        const load = async () => {
            const data = await getFullTimelineCard(id);
            setEvents(sortEvents(data.events || []));
        };
        load();
    }, [id]);

    useEffect(() => {
        if (isModalOpen) {
            getAllTags(campaignId).then((tags) => setAllAvailableTags(tags as Tag[]));
        }
    }, [isModalOpen, campaignId]);

    const handleSaveCard = async () => {
        await supabase.from('page_cards').update({ title, data: { description } }).eq('id', id);
        setTempData({ title, description });
        setIsEditingCard(false);
    };

    const handleCancelCard = () => {
        setTitle(tempData.title);
        setDescription(tempData.description);
        setIsEditingCard(false);
    };

    const addEvent = async () => {
        const { data } = await supabase.from('timeline_events').insert([{ card_id: id, title: "New Event", event_date: "", description: "" }]).select().single();
        if (data) setEvents(sortEvents([...events, data]));
    };

    const updateEvent = async (eventId: string, field: string, value: string) => {
        await supabase.from('timeline_events').update({ [field]: value }).eq('id', eventId);
        setEvents(prev => sortEvents(prev.map(e => e.id === eventId ? { ...e, [field]: value } : e)));
    };

    const deleteEvent = async (eventId: string) => {
        await supabase.from('timeline_events').delete().eq('id', eventId);
        setEvents(events.filter(e => e.id !== eventId));
        setEditingId(null);
    };

    return (
        <div id={`card-${id}`} className={styles.timelineCard}>

            <div className={styles.tagSection}>
                <TagDisplay
                    tags={tags.map(t => ({
                        id: t.tag_id,
                        label: t.tags?.name || t.tags?.label || "Unknown"
                    }))}
                    onAdd={() => setIsModalOpen(true)}
                    onRemove={(tagId) => handleRemove(tagId)}
                />
            </div>

            <div className={styles.headerSection}>
                {isEditingCard ? (
                    <div className={styles.editCardRow}>
                        <input className={styles.cardTitleInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
                        <textarea className={styles.cardDescInput} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Card description..." />
                    </div>
                ) : (
                    <>
                        <h2>{title}</h2>
                        <p>{description}</p>
                    </>
                )}
            </div>

            <div className={styles.timelineContainer}>
                {events.map((e, index) => {
                    const isLeft = index % 2 === 0;
                    return (
                        <div key={e.id} className={styles.timelineRow}>
                            <div className={styles.itemSide}>
                                {isLeft && renderEvent(e, editingId, setEditingId, updateEvent, deleteEvent, setEvents, events)}
                            </div>

                            <div className={styles.centerDot} />

                            <div className={styles.itemSide}>
                                {!isLeft && renderEvent(e, editingId, setEditingId, updateEvent, deleteEvent, setEvents, events)}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.actionContainer}>
                {isEditingCard ? (
                    <>
                        <button className={styles.cancelBtn} onClick={handleCancelCard}>Cancel</button>
                        <button className={styles.deleteBtn} onClick={() => onDelete(id)}>Delete Card</button>
                        <button className={styles.saveBtn} onClick={handleSaveCard}>Save</button>
                    </>
                ) : (
                    <>
                        <button className={styles.addEventBtn} onClick={addEvent}>+ Add New Event</button>
                        <button className={styles.editBtn} onClick={() => setIsEditingCard(true)}> ✎ Edit card </button>
                    </>
                )}
            </div>

            <TagModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} allTags={allAvailableTags} setAllTags={setAllAvailableTags} campaignId={campaignId} onAdd={async (name) => { await handleAdd(name); setIsModalOpen(false); }} />
        </div>
    );
}

function renderEvent(e: any, editingId: string | null, setEditingId: any, updateEvent: any, deleteEvent: any, setEvents: any, events: any[]) {
    return editingId === e.id ? (
        <div className={styles.editRow}>
            <input className={styles.dateInput} value={e.event_date || ""} onChange={(v) => setEvents(events.map(ev => ev.id === e.id ? { ...ev, event_date: v.target.value } : ev))} placeholder="Date" />
            <input className={styles.titleInput} value={e.title || ""} onChange={(v) => setEvents(events.map(ev => ev.id === e.id ? { ...ev, title: v.target.value } : ev))} placeholder="Event Name" />
            <textarea className={styles.descInput} value={e.description || ""} onChange={(v) => setEvents(events.map(ev => ev.id === e.id ? { ...ev, description: v.target.value } : ev))} placeholder="Description..." />

            <div className={styles.eventActionButtons}>
                <button className={styles.cancelEventBtn} onClick={() => setEditingId(null)}>Cancel</button>
                <button className={styles.deleteEventBtn} onClick={() => deleteEvent(e.id)}>Delete</button>
                <button className={styles.saveEventBtn} onClick={() => { updateEvent(e.id, 'event_date', e.event_date); updateEvent(e.id, 'title', e.title); updateEvent(e.id, 'description', e.description); setEditingId(null); }}>Save</button>
            </div>

        </div>
    ) : (
        <div className={styles.card}>
            <small className={styles.eventYear}>{e.event_date}</small>
            <h3>{e.title}</h3>
            <p>{e.description}</p>
            <button className={styles.editEventBtn} onClick={() => setEditingId(e.id)}>✎ Edit</button>
        </div>
    );
}