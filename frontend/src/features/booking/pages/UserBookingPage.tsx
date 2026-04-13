import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Calendar, ChevronRight, Loader2, X, Euro, CheckCircle } from "lucide-react";
import { http } from "@/api/http";
import { useNavigate, useLocation } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Court {
    id: number;
    name: string;
    description?: string;
    pricePerHour: number;
    surface?: string;
    imageUrl?: string;
    location?: string;
    isAvailable: boolean;
    timeSlots: TimeSlot[];
}

interface TimeSlot {
    id: number;
    courtId: number;
    startTime: string;
    endTime: string;
    isBooked: boolean;
}

interface BookingResponse {
    id: number;
    courtName: string;
    slotStartTime: string;
    slotEndTime: string;
    durationHours: number;
    totalPrice: number;
    status: string;
    mode: string;
}

interface MyBooking {
    id: number;
    courtName: string;
    slotStartTime: string;
    slotEndTime: string;
    durationHours: number;
    totalPrice: number;
    status: string;
    mode: string;
}

type Step = "courts" | "slots" | "confirm";
type BookingMode = "SIMPLE" | "MATCH";
type MatchType = "1VS1" | "2VS2";
type Tab = "book" | "my";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", {
        weekday: "short", day: "numeric", month: "long",
        hour: "2-digit", minute: "2-digit",
    });

const surfaceEmoji: Record<string, string> = {
    Clay: "🟫", Hard: "🔵", Grass: "🟩", Indoor: "🏠",
};

const DEFAULT_IMAGE = "https://i.pinimg.com/1200x/85/e6/c1/85e6c1f382243bf195cc4e19522a6e36.jpg";

const statusLabel: Record<string, string> = {
    PENDING_PAYMENT: "En attente de paiement",
    PENDING_MATCH: "En attente de match",
    CONFIRMED: "Confirmée",
    CANCELLED: "Annulée",
    MATCH_WAITING_PLAYERS: "Attente joueurs",
};

const statusColor: Record<string, string> = {
    PENDING_PAYMENT: "#d97706",
    PENDING_MATCH: "#7c3aed",
    CONFIRMED: "#16a34a",
    CANCELLED: "#ef4444",
    MATCH_WAITING_PLAYERS: "#0ea5e9",
};

// ─── Composant principal ──────────────────────────────────────────────────────

export default function UserBookingPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const locationState = location.state as { paymentSuccess?: boolean } | null;

    // ── Tabs ──────────────────────────────────────────────────────────────────
    const [tab, setTab] = useState<Tab>(locationState?.paymentSuccess ? "my" : "book");

    // ── Réservation ───────────────────────────────────────────────────────────
    const [step, setStep] = useState<Step>("courts");
    const [courts, setCourts] = useState<Court[]>([]);
    const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [duration, setDuration] = useState(1);
    const [mode, setMode] = useState<BookingMode>("SIMPLE");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Succès paiement retour ────────────────────────────────────────────────
    const [successMessage, setSuccessMessage] = useState<string | null>(
        locationState?.paymentSuccess
            ? "✅ Paiement validé ! Votre réservation est confirmée."
            : null
    );

    // ── Mes réservations ──────────────────────────────────────────────────────
    const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(false);

    // ── Modal match ───────────────────────────────────────────────────────────
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [pendingBooking, setPendingBooking] = useState<BookingResponse | null>(null);
    const [matchType, setMatchType] = useState<MatchType>("1VS1");
    const [creatingMatch, setCreatingMatch] = useState(false);

    // ── Chargement terrains ───────────────────────────────────────────────────
    const loadCourts = () => {
        setLoading(true);
        http.get<Court[]>("booking/api/user/courts")
            .then(r => setCourts(r.data))
            .catch(() => setError("Impossible de charger les terrains."))
            .finally(() => setLoading(false));
    };

    // ── Chargement mes réservations ───────────────────────────────────────────
    const loadMyBookings = async () => {
        setLoadingBookings(true);
        try {
            const res = await http.get<MyBooking[]>("booking/api/user/bookings/me");
            setMyBookings(Array.isArray(res.data) ? res.data : []);
        } catch {
            setMyBookings([]);
        } finally {
            setLoadingBookings(false);
        }
    };

    useEffect(() => {
        loadCourts();
        void loadMyBookings();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Handlers navigation ───────────────────────────────────────────────────
    const handleSelectCourt = (court: Court) => {
        setSelectedCourt(court);
        setSelectedSlot(null);
        setStep("slots");
    };

    const handleSelectSlot = (slot: TimeSlot) => {
        setSelectedSlot(slot);
        setStep("confirm");
    };

    // ── Confirmation réservation ──────────────────────────────────────────────
    const handleBook = async () => {
        if (!selectedCourt || !selectedSlot) return;
        setLoading(true);
        setError(null);
        try {
            const res = await http.post<BookingResponse>("booking/api/user/bookings", {
                courtId: selectedCourt.id,
                timeSlotId: selectedSlot.id,
                durationHours: duration,
                mode,
            });
            const bookingData = res.data;

            if (mode === "MATCH") {
                setPendingBooking(bookingData);
                setMatchType("1VS1");
                setShowMatchModal(true);
            } else {
                navigate("/payment", {
                    state: {
                        bookingId: bookingData.id,
                        courtName: bookingData.courtName,
                        amount: bookingData.totalPrice,
                        slotStartTime: bookingData.slotStartTime,
                    }
                });
            }
        } catch (e: unknown) {
            setError((e as Error)?.message ?? "Erreur lors de la réservation.");
        } finally {
            setLoading(false);
        }
    };

    // ── Création match depuis le popup ────────────────────────────────────────
    const handleCreateMatch = async () => {
        if (!pendingBooking) return;
        setCreatingMatch(true);
        try {
            const res = await http.post("/match/api/matchs/initiate", {
                bookingId: pendingBooking.id,
                matchType,
                totalCourtPrice: pendingBooking.totalPrice,
                courtName: pendingBooking.courtName,
                slotStartTime: pendingBooking.slotStartTime,
            });
            setShowMatchModal(false);
            const matchData = (res.data ?? res) as { id: number; pricePerPlayer?: number };
            navigate("/payment", {
                state: {
                    matchId: matchData.id,
                    bookingId: pendingBooking.id,
                    amount: matchData.pricePerPlayer ?? pendingBooking.totalPrice / (matchType === "1VS1" ? 2 : 4),
                    matchType,
                    courtName: pendingBooking.courtName,
                    slotStartTime: pendingBooking.slotStartTime,
                },
            });
        } catch (e: unknown) {
            setError((e as Error)?.message ?? "Erreur lors de la création du match.");
            setShowMatchModal(false);
        } finally {
            setCreatingMatch(false);
        }
    };

    // ── Annuler une réservation ───────────────────────────────────────────────
    const handleCancelBooking = async (bookingId: number) => {
        if (!confirm("Annuler cette réservation ?")) return;
        try {
            await http.delete(`booking/api/user/bookings/${bookingId}`);
            await loadMyBookings();
            loadCourts();
        } catch {
            setError("Impossible d'annuler cette réservation.");
        }
    };

    const pricePerPlayer = pendingBooking
        ? pendingBooking.totalPrice / (matchType === "1VS1" ? 2 : 4)
        : 0;

    return (
        <div className="bp-page">
            <style>{CSS}</style>

            {/* ── HERO ── */}
            <section className="bp-hero">
                <div className="bp-hero-overlay" />
                <motion.div
                    className="bp-hero-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55 }}
                >
                    <div className="badge">🎾 AceArena — Réservation</div>
                    <h1 className="heroTitle">Réserve ton terrain</h1>
                    <p className="heroSubtitle">
                        Choisis un court, sélectionne un créneau et confirme en quelques secondes.
                    </p>

                    {tab === "book" && (
                        <div className="bp-stepper">
                            {(["courts", "slots", "confirm"] as Step[]).map((s, i) => {
                                const labels = ["Terrain", "Créneau", "Confirmation"];
                                const idx = ["courts", "slots", "confirm"].indexOf(step);
                                const done = i < idx;
                                const active = s === step;
                                return (
                                    <div key={s} className="bp-step-item">
                                        <div className={`bp-step-dot ${active ? "active" : ""} ${done ? "done" : ""}`}>
                                            {done ? "✓" : i + 1}
                                        </div>
                                        <span className={`bp-step-label ${active ? "active" : ""}`}>{labels[i]}</span>
                                        {i < 2 && <ChevronRight size={14} className="bp-step-arrow" />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </section>

            {/* ── TABS ── */}
            <div className="bp-tabs">
                <div className="bp-tabs-inner">
                    <button
                        className={`bp-tab ${tab === "book" ? "active" : ""}`}
                        onClick={() => setTab("book")}
                    >
                        🎾 Réserver
                    </button>
                    <button
                        className={`bp-tab ${tab === "my" ? "active" : ""}`}
                        onClick={() => { setTab("my"); void loadMyBookings(); }}
                    >
                        📋 Mes réservations ({myBookings.length})
                    </button>
                </div>
            </div>

            {/* ── CONTENU ── */}
            <main className="bp-main">

                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: "#f0fdf4", border: "1px solid #bbf7d0",
                            color: "#15803d", borderRadius: 12,
                            padding: "14px 18px", marginBottom: 20,
                            fontSize: 14, fontWeight: 600,
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}
                    >
                        <span><CheckCircle size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />{successMessage}</span>
                        <button onClick={() => setSuccessMessage(null)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#15803d" }}>✕</button>
                    </motion.div>
                )}

                {error && (
                    <motion.div className="bp-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <X size={16} /> {error}
                        <button onClick={() => setError(null)}>✕</button>
                    </motion.div>
                )}

                {/* ── ONGLET 1 — RÉSERVER ── */}
                {tab === "book" && (
                    <AnimatePresence mode="wait">

                        {step === "courts" && (
                            <motion.div key="courts" {...fade}>
                                <SectionHeader title="Terrains disponibles" desc="Sélectionne le terrain que tu souhaites réserver." />
                                {loading ? <Spinner /> : (
                                    <div className="bp-grid">
                                        {courts.filter(c => c.isAvailable).map((court, i) => (
                                            <motion.article
                                                key={court.id}
                                                className="bp-card"
                                                initial={{ opacity: 0, y: 22 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.07 }}
                                                onClick={() => handleSelectCourt(court)}
                                            >
                                                <div className="bp-card-img">
                                                    <img
                                                        src={court.imageUrl || DEFAULT_IMAGE}
                                                        alt={court.name}
                                                        onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                                                    />
                                                </div>
                                                <div className="cardBody">
                                                    <h3 className="cardTitle">{court.name}</h3>
                                                    {court.description && <p className="bp-card-desc">{court.description}</p>}
                                                    <div className="meta">
                                                        <div className="metaItem"><MapPin size={14} /><span>{court.location || "Non renseigné"}</span></div>
                                                        {court.surface && (
                                                            <div className="metaItem">
                                                                <span className="bp-surface-badge">{surfaceEmoji[court.surface] ?? "🎾"} {court.surface}</span>
                                                            </div>
                                                        )}
                                                        <div className="metaItem"><Euro size={14} /><span>{court.pricePerHour}€/h</span></div>
                                                    </div>
                                                    <button className="secondaryBtn">Choisir ce terrain <ChevronRight size={14} /></button>
                                                </div>
                                            </motion.article>
                                        ))}
                                        {courts.filter(c => c.isAvailable).length === 0 && !loading && (
                                            <p className="bp-empty">Aucun terrain disponible pour le moment.</p>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === "slots" && selectedCourt && (
                            <motion.div key="slots" {...fade}>
                                <BackBtn onClick={() => setStep("courts")} />
                                <SectionHeader title={`Créneaux — ${selectedCourt.name}`} desc="Sélectionne un créneau disponible." />
                                <div className="bp-slots-grid">
                                    {selectedCourt.timeSlots.length === 0 ? (
                                        <p className="bp-empty">Aucun créneau pour ce terrain.</p>
                                    ) : (
                                        selectedCourt.timeSlots.map((slot, i) => (
                                            <motion.button
                                                key={slot.id}
                                                className={`bp-slot ${slot.isBooked ? "bp-slot-booked" : ""}`}
                                                initial={{ opacity: 0, y: 14 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                onClick={() => !slot.isBooked && handleSelectSlot(slot)}
                                                disabled={slot.isBooked}
                                            >
                                                <Calendar size={16} className="bp-slot-icon" />
                                                <div style={{ flex: 1 }}>
                                                    <div className="bp-slot-date">{formatDate(slot.startTime)}</div>
                                                    <div className="bp-slot-end">→ {formatDate(slot.endTime)}</div>
                                                </div>
                                                {slot.isBooked && <span className="bp-slot-tag">Réservé</span>}
                                            </motion.button>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === "confirm" && selectedCourt && selectedSlot && (
                            <motion.div key="confirm" {...fade}>
                                <BackBtn onClick={() => setStep("slots")} />
                                <SectionHeader title="Confirmer la réservation" desc="Vérifie les détails avant de valider." />
                                <div className="bp-confirm-card">
                                    <div className="bp-recap">
                                        <RecapRow icon="🎾" label="Terrain" value={selectedCourt.name} />
                                        <RecapRow icon={surfaceEmoji[selectedCourt.surface ?? ""] ?? "🎾"} label="Surface" value={selectedCourt.surface ?? "—"} />
                                        <RecapRow icon="📍" label="Lieu" value={selectedCourt.location ?? "—"} />
                                        <RecapRow icon="📅" label="Début" value={formatDate(selectedSlot.startTime)} />
                                        <RecapRow icon="🏁" label="Fin" value={formatDate(selectedSlot.endTime)} />
                                    </div>

                                    <div className="bp-field">
                                        <label className="bp-label"><Clock size={14} /> Durée (heures)</label>
                                        <div className="bp-duration-row">
                                            {[1, 2, 3].map(d => (
                                                <button key={d} className={`bp-duration-btn ${duration === d ? "active" : ""}`} onClick={() => setDuration(d)}>{d}h</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bp-field">
                                        <label className="bp-label">🎮 Mode de jeu</label>
                                        <div className="bp-mode-row">
                                            <button className={`bp-mode-btn ${mode === "SIMPLE" ? "active" : ""}`} onClick={() => setMode("SIMPLE")}>
                                                🎾 Solo / Duo
                                                <span className="bp-mode-desc">Paiement direct</span>
                                            </button>
                                            <button className={`bp-mode-btn ${mode === "MATCH" ? "active" : ""}`} onClick={() => setMode("MATCH")}>
                                                ⚔️ Match
                                                <span className="bp-mode-desc">Créer & inviter des joueurs</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bp-total">
                                        <span>Total estimé</span>
                                        <span className="bp-total-price">{(selectedCourt.pricePerHour * duration).toFixed(2)} €</span>
                                    </div>

                                    <button className="primaryBtn bp-submit" onClick={() => { void handleBook(); }} disabled={loading}>
                                        {loading && <Loader2 size={16} className="bp-spin" />}
                                        {loading ? "Réservation en cours…" : mode === "MATCH" ? "Continuer vers le Match ⚔️" : "Confirmer et payer 💳"}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                )}

                {/* ── ONGLET 2 — MES RÉSERVATIONS ── */}
                {tab === "my" && (
                    <motion.div key="my" {...fade}>
                        <SectionHeader title="Mes réservations" desc="Retrouve toutes tes réservations passées et à venir." />
                        {loadingBookings ? <Spinner /> : myBookings.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                                <p>Aucune réservation pour le moment.</p>
                                <button className="secondaryBtn" style={{ margin: "12px auto 0", display: "inline-flex" }} onClick={() => setTab("book")}>
                                    Faire une réservation <ChevronRight size={14} />
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                {myBookings
                                    .sort((a, b) => new Date(b.slotStartTime).getTime() - new Date(a.slotStartTime).getTime())
                                    .map((booking, i) => (
                                        <motion.div
                                            key={booking.id}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            style={{
                                                background: "#fff", border: "1px solid rgba(15,23,42,.08)",
                                                borderRadius: 16, padding: "18px 20px",
                                                boxShadow: "0 4px 14px rgba(2,6,23,.07)",
                                                display: "flex", justifyContent: "space-between",
                                                alignItems: "flex-start", gap: 12, flexWrap: "wrap",
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                                    <span style={{ fontWeight: 800, fontSize: 16 }}>{booking.courtName}</span>
                                                    <span style={{
                                                        padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                                                        background: `${statusColor[booking.status] ?? "#64748b"}18`,
                                                        color: statusColor[booking.status] ?? "#64748b",
                                                        border: `1px solid ${statusColor[booking.status] ?? "#64748b"}40`,
                                                    }}>{statusLabel[booking.status] ?? booking.status}</span>
                                                    <span style={{
                                                        padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                                                        background: booking.mode === "MATCH" ? "#f0f4ff" : "#f0fdf4",
                                                        color: booking.mode === "MATCH" ? "#4338ca" : "#16a34a",
                                                        border: `1px solid ${booking.mode === "MATCH" ? "#c7d2fe" : "#bbf7d0"}`,
                                                    }}>{booking.mode === "MATCH" ? "⚔️ Match" : "🎾 Simple"}</span>
                                                </div>
                                                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#64748b" }}>
                                                    <span>📅 {formatDate(booking.slotStartTime)}</span>
                                                    <span>⏱ {booking.durationHours}h</span>
                                                    <span>💶 {booking.totalPrice.toFixed(2)} €</span>
                                                </div>
                                            </div>
                                            {(booking.status === "PENDING_PAYMENT" || booking.status === "PENDING_MATCH") && (
                                                <button
                                                    onClick={() => { void handleCancelBooking(booking.id); }}
                                                    style={{
                                                        border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.06)",
                                                        color: "#dc2626", fontWeight: 700, fontSize: 12,
                                                        padding: "6px 12px", borderRadius: 10, cursor: "pointer",
                                                    }}
                                                >Annuler</button>
                                            )}
                                        </motion.div>
                                    ))}
                            </div>
                        )}
                    </motion.div>
                )}

            </main>

            <footer className="footer">© {new Date().getFullYear()} AceArena — Tous droits réservés</footer>

            {/* ── POPUP CRÉATION MATCH ── */}
            <AnimatePresence>
                {showMatchModal && pendingBooking && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: "fixed", inset: 0, background: "rgba(11,18,32,.65)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}
                        onClick={() => setShowMatchModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
                            transition={{ type: "spring", stiffness: 280, damping: 24 }}
                            onClick={e => e.stopPropagation()}
                            style={{ background: "#fff", borderRadius: 24, padding: "32px 28px", width: "min(480px, 100%)", boxShadow: "0 24px 60px rgba(2,6,23,.25)" }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>⚔️ Créer un match</h2>
                                    <p style={{ margin: "5px 0 0", fontSize: 13, color: "#64748b" }}>Réservation #{pendingBooking.id} — {pendingBooking.courtName}</p>
                                </div>
                                <button onClick={() => setShowMatchModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}><X size={20} /></button>
                            </div>

                            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 16px", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 13, color: "#64748b" }}>Prix total terrain</span>
                                <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{pendingBooking.totalPrice.toFixed(2)} €</span>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 10 }}>Type de match</label>
                                <div style={{ display: "flex", gap: 12 }}>
                                    {(["1VS1", "2VS2"] as MatchType[]).map(t => (
                                        <button key={t} onClick={() => setMatchType(t)} style={{
                                            flex: 1, padding: "14px 12px", borderRadius: 14,
                                            border: matchType === t ? "2px solid #16a34a" : "1.5px solid #e2e8f0",
                                            background: matchType === t ? "#f0fdf4" : "#f8fafc",
                                            color: matchType === t ? "#166534" : "#475569",
                                            fontWeight: 700, cursor: "pointer", fontSize: 15,
                                            display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.18s",
                                        }}>
                                            <span style={{ fontSize: 22 }}>{t === "1VS1" ? "⚔️" : "👥"}</span>
                                            {t}
                                            <span style={{ fontSize: 11, fontWeight: 400, color: matchType === t ? "#16a34a" : "#94a3b8" }}>
                                                {t === "1VS1" ? "2 joueurs" : "4 joueurs"}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, marginBottom: 2 }}>Prix par joueur</div>
                                    <div style={{ fontSize: 11, color: "#64748b" }}>{matchType === "1VS1" ? "2 joueurs" : "4 joueurs"} × {pricePerPlayer.toFixed(2)}€</div>
                                </div>
                                <span style={{ fontSize: 26, fontWeight: 900, color: "#16a34a" }}>{pricePerPlayer.toFixed(2)} €</span>
                            </div>

                            <button
                                onClick={() => { void handleCreateMatch(); }}
                                disabled={creatingMatch}
                                style={{
                                    width: "100%", padding: "14px",
                                    background: creatingMatch ? "#94a3b8" : "#16a34a",
                                    color: "#fff", fontWeight: 700, fontSize: 15,
                                    border: "none", borderRadius: 14,
                                    cursor: creatingMatch ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    transition: "background 0.18s",
                                }}
                            >
                                {creatingMatch ? <><Loader2 size={16} className="bp-spin" /> Création en cours…</> : <>Créer le match et inviter des joueurs <ChevronRight size={16} /></>}
                            </button>

                            <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 12 }}>
                                Le match sera visible dans la page Match pour que d'autres joueurs le rejoignent.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

const fade = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.28 },
};

function SectionHeader({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="sectionHeader">
            <h2 className="sectionTitle">{title}</h2>
            <p className="sectionDesc">{desc}</p>
        </div>
    );
}

function BackBtn({ onClick }: { onClick: () => void }) {
    return <button className="bp-back" onClick={onClick}>← Retour</button>;
}

function RecapRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="bp-recap-row">
            <span className="bp-recap-label">{icon} {label}</span>
            <span className="bp-recap-value">{value}</span>
        </div>
    );
}

function Spinner() {
    return (
        <div className="bp-spinner-wrap">
            <Loader2 size={32} className="bp-spin" color="#16a34a" />
        </div>
    );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
:root {
    --green: #16a34a;
    --greenDark: #0f7a35;
    --text: #0f172a;
    --muted: #64748b;
    --card: #ffffff;
    --border: rgba(15, 23, 42, .10);
    --shadow: 0 14px 40px rgba(2, 6, 23, .12);
}
.bp-page { min-height: 100vh; display: flex; flex-direction: column; background: #f6f8fb; color: var(--text); font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
.bp-hero { position: relative; min-height: 44vh; display: flex; align-items: center; justify-content: center; overflow: hidden; background: linear-gradient(135deg, #0b1220 0%, #0f2d1a 60%, #0b1220 100%); }
.bp-hero-overlay { position: absolute; inset: 0; background: radial-gradient(ellipse at 60% 40%, rgba(22,163,74,0.18) 0%, transparent 70%); }
.bp-hero-content { position: relative; width: min(980px, 92vw); padding: 44px 18px; color: white; }
.bp-tabs { background: #fff; border-bottom: 1px solid rgba(15,23,42,.08); }
.bp-tabs-inner { max-width: 980px; margin: 0 auto; padding: 0 20px; display: flex; }
.bp-tab { padding: 16px 20px; background: none; border: none; border-bottom: 2px solid transparent; color: #64748b; font-weight: 500; cursor: pointer; font-size: 14px; transition: all .2s; font-family: inherit; }
.bp-tab.active { border-bottom-color: var(--green); color: var(--green); font-weight: 700; }
.bp-stepper { display: flex; align-items: center; gap: 6px; margin-top: 24px; flex-wrap: wrap; }
.bp-step-item { display: flex; align-items: center; gap: 6px; }
.bp-step-dot { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.12); border: 1.5px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.5); transition: all 0.3s; }
.bp-step-dot.active { background: var(--green); border-color: var(--green); color: white; box-shadow: 0 0 0 4px rgba(22,163,74,0.25); }
.bp-step-dot.done { background: rgba(22,163,74,0.25); border-color: var(--green); color: #4ade80; }
.bp-step-label { font-size: 12px; color: rgba(255,255,255,0.45); font-weight: 500; }
.bp-step-label.active { color: white; font-weight: 700; }
.bp-step-arrow { color: rgba(255,255,255,0.2); }
.bp-main { width: min(980px, 92vw); margin: 0 auto; padding: 34px 0 46px; flex: 1; }
.bp-error { display: flex; align-items: center; gap: 10px; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; font-size: 14px; }
.bp-error button { margin-left: auto; background: none; border: none; cursor: pointer; color: #dc2626; font-size: 16px; }
.bp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
@media (max-width: 768px) { .bp-grid { grid-template-columns: 1fr; } }
.bp-card { background: var(--card); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; box-shadow: var(--shadow); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
.bp-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(2,6,23,.18); }
.bp-card-img { width: 100%; height: 160px; overflow: hidden; }
.bp-card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.bp-card:hover .bp-card-img img { transform: scale(1.05); }
.bp-surface-badge { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 999px; padding: 2px 8px; font-size: 12px; font-weight: 700; color: #166534; }
.bp-card-desc { margin: 0; font-size: 13px; color: var(--muted); line-height: 1.4; }
.bp-slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; margin-top: 8px; }
.bp-slot { display: flex; align-items: center; gap: 14px; background: white; border: 1.5px solid var(--border); border-radius: 14px; padding: 14px 16px; cursor: pointer; text-align: left; transition: all 0.18s; box-shadow: 0 4px 14px rgba(2,6,23,.07); }
.bp-slot:hover:not(:disabled) { border-color: var(--green); background: rgba(22,163,74,0.04); transform: translateX(4px); }
.bp-slot-icon { color: var(--green); flex-shrink: 0; }
.bp-slot-date { font-size: 14px; font-weight: 600; color: #0f172a; }
.bp-slot-end { font-size: 12px; color: var(--muted); margin-top: 2px; }
.bp-slot-booked { opacity: 0.45; cursor: not-allowed !important; background: #f1f5f9 !important; border-color: #e2e8f0 !important; }
.bp-slot-booked .bp-slot-icon { color: #94a3b8; }
.bp-slot-tag { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 999px; background: #e2e8f0; color: #64748b; white-space: nowrap; flex-shrink: 0; }
.bp-confirm-card { background: white; border: 1px solid var(--border); border-radius: 20px; padding: 28px; box-shadow: var(--shadow); max-width: 560px; }
.bp-recap { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.bp-recap-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f8fafc; border-radius: 10px; }
.bp-recap-label { font-size: 13px; color: var(--muted); font-weight: 500; }
.bp-recap-value { font-size: 13px; font-weight: 700; color: #0f172a; }
.bp-field { margin-bottom: 20px; }
.bp-label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 10px; }
.bp-duration-row { display: flex; gap: 10px; }
.bp-duration-btn { flex: 1; padding: 10px; border-radius: 12px; border: 1.5px solid var(--border); background: #f8fafc; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.18s; }
.bp-duration-btn.active { border-color: var(--green); background: rgba(22,163,74,0.08); color: var(--green); }
.bp-duration-btn:hover:not(.active) { border-color: #94a3b8; }
.bp-mode-row { display: flex; gap: 12px; }
.bp-mode-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 12px; border-radius: 14px; border: 1.5px solid var(--border); background: #f8fafc; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.18s; }
.bp-mode-btn.active { border-color: var(--green); background: rgba(22,163,74,0.08); color: var(--green); }
.bp-mode-desc { font-size: 11px; font-weight: 400; color: var(--muted); }
.bp-mode-btn.active .bp-mode-desc { color: var(--green); opacity: 0.8; }
.bp-total { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: 14px; margin-bottom: 20px; border: 1px solid rgba(22,163,74,0.2); }
.bp-total span:first-child { font-size: 14px; font-weight: 600; color: #166534; }
.bp-total-price { font-size: 24px; font-weight: 900; color: var(--green); }
.bp-submit { width: 100%; padding: 14px; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.bp-submit:disabled { opacity: 0.7; cursor: not-allowed; }
.bp-back { background: none; border: 1px solid var(--border); border-radius: 10px; padding: 7px 14px; font-size: 13px; font-weight: 600; cursor: pointer; color: #475569; margin-bottom: 20px; transition: all 0.18s; }
.bp-back:hover { background: #f1f5f9; }
.bp-empty { color: var(--muted); font-size: 14px; padding: 20px 0; }
.bp-spinner-wrap { display: flex; justify-content: center; padding: 48px; }
@keyframes bp-spin { to { transform: rotate(360deg); } }
.bp-spin { animation: bp-spin 0.8s linear infinite; }
.badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border: 1px solid rgba(74,222,128,.25); border-radius: 999px; background: rgba(74,222,128,.1); backdrop-filter: blur(8px); font-size: 12px; font-weight: 800; letter-spacing: .5px; color: #4ade80; text-transform: uppercase; margin-bottom: 14px; }
.heroTitle { margin: 0; font-size: clamp(28px, 3.5vw, 48px); line-height: 1.05; letter-spacing: -0.6px; }
.heroSubtitle { margin: 12px 0 0; color: rgba(255,255,255,.88); font-size: 16px; max-width: 580px; }
.sectionHeader { margin-bottom: 16px; }
.sectionTitle { margin: 0; font-size: 22px; font-weight: 800; }
.sectionDesc { margin: 6px 0 0; color: var(--muted); font-size: 14px; }
.cardBody { padding: 14px 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.cardTitle { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: -0.2px; }
.meta { display: flex; gap: 14px; flex-wrap: wrap; color: #475569; font-size: 13px; }
.metaItem { display: flex; align-items: center; gap: 8px; }
.secondaryBtn { display: flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid rgba(22,163,74,.35); background: rgba(22,163,74,.08); color: #0f7a35; font-weight: 800; padding: 10px 12px; border-radius: 14px; cursor: pointer; font-size: 14px; transition: background 0.18s; }
.secondaryBtn:hover { background: rgba(22,163,74,.14); }
.primaryBtn { border: none; cursor: pointer; background: var(--green); color: white; font-weight: 700; padding: 10px 14px; border-radius: 14px; transition: background 0.18s; }
.primaryBtn:hover:not(:disabled) { background: var(--greenDark); }
.footer { margin-top: auto; border-top: 1px solid rgba(15,23,42,.06); background: #0f172a; color: rgba(255,255,255,.45); text-align: center; padding: 22px 10px; font-size: 13px; }
`;