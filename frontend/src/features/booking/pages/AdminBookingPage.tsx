import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Image, Upload, Check, Loader2, X, MapPin, Zap, Calendar } from "lucide-react";
import { bookingApi } from "../api/booking.api";
import { ADMIN_BOOKING_CSS, PRESET_IMAGES } from "../styles/booking.styles";
import type { Court, CreateCourtRequest } from "../types/booking.types";

const SURFACES = ["Clay", "Hard", "Grass", "Indoor"];

const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const EMPTY_COURT_FORM: CreateCourtRequest = {
    name: "",
    description: "",
    pricePerHour: 20,
    surface: "Clay",
    imageUrl: "",
    location: "",
};

export default function AdminBookingPage() {
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<CreateCourtRequest>(EMPTY_COURT_FORM);
    const [imageMode, setImageMode] = useState<"preset" | "url">("preset");
    const [saving, setSaving] = useState(false);

    const [slotCourtId, setSlotCourtId] = useState<number | null>(null);
    // ✅ FIX : valeur initiale vide et contrôlée
    const [slotForm, setSlotForm] = useState({ startTime: "", endTime: "" });
    const [savingSlot, setSavingSlot] = useState(false);

    // ── Chargement ────────────────────────────────────────────────────────────

    const load = async () => {
        setLoading(true);
        try {
            const data = await bookingApi.getCourts();
            setCourts(data);
        } catch {
            setError("Erreur chargement terrains");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const notify = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), 3000);
    };

    const setField = <K extends keyof CreateCourtRequest>(key: K, value: CreateCourtRequest[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    // ── Actions terrain ───────────────────────────────────────────────────────

    const handleCreateCourt = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            await bookingApi.createCourt({
                ...form,
                description: form.description || undefined,
                imageUrl: form.imageUrl || undefined,
            });
            notify("✅ Terrain créé !");
            setForm(EMPTY_COURT_FORM);
            setShowForm(false);
            load();
        } catch {
            setError("Erreur création terrain");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCourt = async (id: number) => {
        if (!confirm("Supprimer ce terrain ?")) return;
        try {
            await bookingApi.deleteCourt(id);
            notify("🗑️ Terrain supprimé");
            load();
        } catch {
            setError("Erreur suppression terrain");
        }
    };

    // ── Actions créneau ───────────────────────────────────────────────────────

    const handleCreateSlot = async () => {
        if (slotCourtId === null || !slotForm.startTime || !slotForm.endTime) return;
        setSavingSlot(true);
        try {
            // ✅ FIX : new Date().toISOString() convertit proprement en UTC ISO 8601
            const startTime = new Date(slotForm.startTime).toISOString();
            const endTime = new Date(slotForm.endTime).toISOString();

            const payload = {
                courtId: slotCourtId,
                startTime,
                endTime,
            };

            console.log("📤 Payload envoyé :", payload);

            await bookingApi.createSlot(payload);
            notify("✅ Créneau ajouté !");
            // ✅ FIX : reset propre des inputs contrôlés
            setSlotCourtId(null);
            setSlotForm({ startTime: "", endTime: "" });
            load();
        } catch (e) {
            console.error(e);
            setError("Erreur création créneau");
        } finally {
            setSavingSlot(false);
        }
    };

    const handleGenerateDaySlots = async (courtId: number) => {
        const dateInput = prompt("Pour quelle date ? (YYYY-MM-DD)", new Date().toISOString().split("T")[0]);
        if (!dateInput) return;

        // ✅ FIX : validation format date
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            setError("Format de date invalide (attendu : YYYY-MM-DD)");
            return;
        }

        setSavingSlot(true);
        try {
            for (let hour = 8; hour < 20; hour++) {
                // ✅ FIX : toISOString() pour garantir le bon format UTC
                const start = new Date(`${dateInput}T${String(hour).padStart(2, "0")}:00:00Z`).toISOString();
                const end = new Date(`${dateInput}T${String(hour + 1).padStart(2, "0")}:00:00Z`).toISOString();
                await bookingApi.createSlot({ courtId, startTime: start, endTime: end });
            }
            notify("⚡ Journée générée !");
            load();
        } catch {
            setError("Erreur lors de la génération massive");
        } finally {
            setSavingSlot(false);
        }
    };

    const handleDeleteSlot = async (slotId: number) => {
        try {
            await bookingApi.deleteSlot(slotId);
            notify("🗑️ Créneau supprimé");
            load();
        } catch {
            setError("Erreur suppression créneau");
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="abp-page">
            <style>{ADMIN_BOOKING_CSS}</style>

            <section className="abp-hero">
                <div className="abp-hero-overlay" />
                <motion.div className="abp-hero-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="badge">⚙️ AceArena — Administration</div>
                    <h1 className="heroTitle">Gestion des Terrains</h1>
                    <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                        {[
                            { num: courts.length, label: "Terrains" },
                            { num: courts.reduce((s, c) => s + c.timeSlots.length, 0), label: "Créneaux" },
                        ].map(({ num, label }) => (
                            <div key={label} className="abp-stat">
                                <span className="abp-stat-num">{num}</span>
                                <span className="abp-stat-label">{label}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            <main className="abp-main">
                <AnimatePresence>
                    {error && (
                        <motion.div className="abp-toast abp-toast-err" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <X size={14} /> {error}
                            <button onClick={() => setError(null)}>✕</button>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div className="abp-toast abp-toast-ok" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <Check size={14} /> {success}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, background: "white", padding: "16px 24px", borderRadius: 16, border: "1px solid rgba(226,232,240,0.8)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Terrains</h2>
                    <button className="abp-btn-primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Fermer" : "Nouveau terrain"}
                    </button>
                </div>

                {/* Formulaire création terrain */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div className="abp-form-card" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                            <div className="abp-form-grid">
                                <div className="abp-field">
                                    <label className="abp-label">Nom *</label>
                                    <input className="abp-input" value={form.name} onChange={e => setField("name", e.target.value)} />
                                </div>
                                <div className="abp-field">
                                    <label className="abp-label">Surface</label>
                                    <select className="abp-input" value={form.surface} onChange={e => setField("surface", e.target.value)}>
                                        {SURFACES.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="abp-field">
                                    <label className="abp-label">Prix / heure (€)</label>
                                    <input className="abp-input" type="number" value={form.pricePerHour} onChange={e => setField("pricePerHour", Number(e.target.value))} />
                                </div>
                                <div className="abp-field" style={{ gridColumn: "1 / -1" }}>
                                    <label className="abp-label"><MapPin size={12} /> Localisation</label>
                                    <input className="abp-input" value={form.location ?? ""} onChange={e => setField("location", e.target.value)} />
                                </div>
                            </div>

                            <div style={{ marginTop: 20 }}>
                                <label className="abp-label" style={{ marginBottom: 10, display: "block" }}>Image</label>
                                <div className="abp-image-tabs">
                                    <button className={`abp-tab ${imageMode === "preset" ? "active" : ""}`} onClick={() => setImageMode("preset")}><Image size={14} /> Bibliothèque</button>
                                    <button className={`abp-tab ${imageMode === "url" ? "active" : ""}`} onClick={() => setImageMode("url")}><Upload size={14} /> URL</button>
                                </div>
                                {imageMode === "preset" ? (
                                    <div className="abp-preset-grid">
                                        {PRESET_IMAGES.map(img => (
                                            <div key={img.url} className={`abp-preset-item ${form.imageUrl === img.url ? "selected" : ""}`} onClick={() => setField("imageUrl", img.url)}>
                                                <img src={img.url} alt="" />
                                                {form.imageUrl === img.url && <div className="abp-preset-check"><Check size={12} /></div>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <input className="abp-input" style={{ width: "100%" }} value={form.imageUrl} onChange={e => setField("imageUrl", e.target.value)} />
                                )}
                            </div>

                            <button className="abp-btn-primary" style={{ marginTop: 20 }} onClick={handleCreateCourt} disabled={saving}>
                                {saving ? <Loader2 className="abp-spin" size={14} /> : <Check size={14} />} Créer le terrain
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="abp-spinner-wrap"><Loader2 size={32} className="abp-spin" color="#16a34a" /></div>
                ) : (
                    <div className="abp-courts-list">
                        {courts.map(court => (
                            <motion.div key={court.id} className="abp-court-row" layout>
                                <div className="abp-court-img">
                                    {court.imageUrl
                                        ? <img src={court.imageUrl} alt="" />
                                        : <div className="abp-court-img-placeholder">🎾</div>
                                    }
                                </div>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                                            {court.name}
                                        </h3>
                                        <span className={`abp-badge ${court.isAvailable ? "green" : "red"}`}>{court.surface}</span>
                                    </div>
                                    {court.location && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, color: "#94a3b8", fontSize: 13 }}>
                                            <MapPin size={12} /> {court.location}
                                        </div>
                                    )}
                                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8, fontSize: 13, color: "#64748b" }}>
                                        <span style={{ fontWeight: 700, color: "#16a34a" }}>{court.pricePerHour}€/h</span>
                                        <span>{court.timeSlots.length} créneau{court.timeSlots.length > 1 ? "x" : ""}</span>
                                        <span>{court.timeSlots.filter((s: any) => s.isBooked).length} réservé{court.timeSlots.filter((s: any) => s.isBooked).length > 1 ? "s" : ""}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                                        <button className="abp-btn-sm abp-btn-green" onClick={() => {
                                            // ✅ FIX : reset le formulaire à l'ouverture
                                            setSlotForm({ startTime: "", endTime: "" });
                                            setSlotCourtId(court.id);
                                        }}>
                                            <Calendar size={12} /> + Créneau
                                        </button>
                                        <button className="abp-btn-sm abp-btn-primary" style={{ background: "#0f172a" }} onClick={() => handleGenerateDaySlots(court.id)}>
                                            <Zap size={12} /> Générer Journée
                                        </button>
                                        <button className="abp-btn-sm abp-btn-red" onClick={() => handleDeleteCourt(court.id)}>
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                <div className="abp-slots-wrap">
                                    {court.timeSlots.map(slot => (
                                        <div key={slot.id} className={`abp-slot-chip ${slot.isBooked ? "booked" : ""}`}>
                                            <span>{formatDate(slot.startTime)}</span>
                                            {!slot.isBooked && (
                                                <button className="abp-slot-del" onClick={() => handleDeleteSlot(slot.id)}>✕</button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <AnimatePresence>
                                    {slotCourtId === court.id && (
                                        <motion.div className="abp-slot-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                                                <div className="abp-field">
                                                    <label className="abp-label">Début</label>
                                                    {/* ✅ FIX : inputs contrôlés avec value= */}
                                                    <input
                                                        className="abp-input"
                                                        type="datetime-local"
                                                        value={slotForm.startTime}
                                                        onChange={e => setSlotForm(prev => ({ ...prev, startTime: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="abp-field">
                                                    <label className="abp-label">Fin</label>
                                                    <input
                                                        className="abp-input"
                                                        type="datetime-local"
                                                        value={slotForm.endTime}
                                                        onChange={e => setSlotForm(prev => ({ ...prev, endTime: e.target.value }))}
                                                    />
                                                </div>
                                                <button className="abp-btn-primary" onClick={handleCreateSlot} disabled={savingSlot}>
                                                    {savingSlot ? <Loader2 className="abp-spin" size={14} /> : "Ajouter"}
                                                </button>
                                                <button className="abp-btn-ghost" onClick={() => {
                                                    setSlotCourtId(null);
                                                    setSlotForm({ startTime: "", endTime: "" });
                                                }}>
                                                    Annuler
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            <footer className="footer">© {new Date().getFullYear()} AceArena Admin</footer>
        </div>
    );
}