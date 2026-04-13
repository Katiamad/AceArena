import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Trophy, Clock, LogIn, LogOut, X, CreditCard } from "lucide-react";
import { http } from "@/api/http";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

type MatchStatus = "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";

interface MatchParticipant {
    id: number;
    userId: number;
    userFirstName: string;
    userLastName: string;
    joinedAt: string;
    hasPaid: boolean;
}

interface Match {
    id: number;
    bookingId: number;
    matchType: string;
    ownerUserId: number;
    ownerFirstName: string;
    ownerLastName: string;
    pricePerPlayer: number;
    maxPlayers: number;
    status: MatchStatus;
    createdAt: string;
    courtName?: string;
    slotStartTime?: string;
    participants: MatchParticipant[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

const getAvailableMatches = () => http.get<Match[]>("/match/api/matchs/available");
const getMyMatches = () => http.get<Match[]>("/match/api/matchs/my");
const joinMatch = (matchId: number) => http.post(`/match/api/matchs/${matchId}/join`);
const leaveMatch = (matchId: number) => http.post(`/match/api/matchs/${matchId}/leave`);
const cancelMatch = (matchId: number) => http.delete(`/match/api/matchs/${matchId}/cancel`);
// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusLabel: Record<MatchStatus, string> = {
    OPEN: "Ouvert",
    FULL: "Complet",
    COMPLETED: "Terminé",
    CANCELLED: "Annulé",
};

const statusColor: Record<MatchStatus, string> = {
    OPEN: "#16a34a",
    FULL: "#d97706",
    COMPLETED: "#64748b",
    CANCELLED: "#ef4444",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MatchStatus }) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.3,
                background: `${statusColor[status]}18`,
                color: statusColor[status],
                border: `1px solid ${statusColor[status]}40`,
            }}
        >
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: statusColor[status],
                    display: "inline-block",
                }}
            />
            {statusLabel[status]}
        </span>
    );
}

function MatchCard({
                       match,
                       myMatchIds,
                       onJoin,
                       onLeave,
                       onCancel,
                       currentUserId,
                       isMyTab,
                   }: {
    match: Match;
    myMatchIds: Set<number>;
    onJoin: (id: number) => void;
    onLeave: (id: number) => void;
    onCancel: (id: number) => void;
    currentUserId: number | null;
    isMyTab?: boolean;
}) {
    const navigate = useNavigate();
    const isOwner = currentUserId === match.ownerUserId;
    const hasJoined = isMyTab || myMatchIds.has(match.id);
    const participantCount = match.participants?.length ?? 0;
    const paidCount = match.participants?.filter(p => p.hasPaid).length ?? 0;
    const progress = (participantCount / match.maxPlayers) * 100;

    // Vérifier si l'utilisateur courant a déjà payé
    const currentParticipant = match.participants?.find(p => p.userId === currentUserId);
    const currentUserHasPaid = currentParticipant?.hasPaid ?? false;

    const handlePayment = () => {
        navigate(`/payment`, {
            state: {
                matchId: match.id,
                bookingId: match.bookingId,
                amount: match.pricePerPlayer,
                matchType: match.matchType,
                courtName: match.courtName,
                slotStartTime: match.slotStartTime,
            },
        });
    };

    const formatSlot = (iso?: string) => {
        if (!iso) return null;
        try {
            return new Date(iso).toLocaleString("fr-FR", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            });
        } catch { return null; }
    };

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.35 }}
            style={{
                background: "#ffffff",
                border: "1px solid rgba(15,23,42,.08)",
                borderRadius: 20,
                padding: "20px 20px 16px",
                boxShadow: "0 8px 30px rgba(2,6,23,.07)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                maxWidth: 560,
                margin: "0 auto",
                width: "100%",
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <Trophy size={16} color="#16a34a" />
                        <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
                            Match {match.matchType}
                        </span>
                    </div>
                    <span style={{ fontSize: 13, color: "#64748b" }}>
                        Organisé par {match.ownerFirstName} {match.ownerLastName}
                    </span>
                    {match.courtName && (
                        <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, marginTop: 4 }}>
                            🎾 {match.courtName}
                            {formatSlot(match.slotStartTime) && ` — ${formatSlot(match.slotStartTime)}`}
                        </div>
                    )}
                </div>
                <StatusBadge status={match.status} />
            </div>

            {/* Progress bar joueurs */}
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                        <Users size={14} />
                        {participantCount} / {match.maxPlayers} joueurs
                    </span>
                    <span style={{ fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                        <Clock size={14} />
                        {new Date(match.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                </div>
                <div style={{ height: 6, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        style={{
                            height: "100%",
                            background: progress >= 100 ? "#d97706" : "#16a34a",
                            borderRadius: 999,
                        }}
                    />
                </div>
            </div>

            {/* Prix */}
            <div
                style={{
                    background: "#f8fafc",
                    borderRadius: 12,
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <span style={{ fontSize: 13, color: "#64748b" }}>Prix par joueur</span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 16 }}>
                    {match.pricePerPlayer?.toFixed(2)}€
                </span>
            </div>

            {/* Participants avec statut paiement */}
            {match.participants && match.participants.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {match.participants.map((p) => (
                        <span
                            key={p.id}
                            style={{
                                background: p.hasPaid ? "#f0fdf4" : "#fefce8",
                                border: `1px solid ${p.hasPaid ? "#bbf7d0" : "#fde68a"}`,
                                borderRadius: 999,
                                fontSize: 12,
                                padding: "3px 10px",
                                color: p.hasPaid ? "#166534" : "#92400e",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                            }}
                        >
                            {p.hasPaid ? "✅" : "⏳"} {p.userFirstName} {p.userLastName}
                        </span>
                    ))}
                </div>
            )}

            {/* Compteur paiements */}
            <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                <CreditCard size={12} />
                {paidCount}/{participantCount} joueur{paidCount > 1 ? "s" : ""} ont payé
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                {/* Rejoindre + Payer : redirige vers le paiement (le join se fait côté backend) */}
                {match.status === "OPEN" && !hasJoined && !isOwner && (
                    <button
                        onClick={() => onJoin(match.id)}
                        style={{
                            flex: 1,
                            border: "1px solid rgba(22,163,74,.35)",
                            background: "linear-gradient(135deg, rgba(22,163,74,.12), rgba(22,163,74,.04))",
                            color: "#0f7a35",
                            fontWeight: 700,
                            padding: "10px 12px",
                            borderRadius: 14,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            fontSize: 14,
                        }}
                    >
                        <LogIn size={15} /> Rejoindre & Payer
                    </button>
                )}

                {hasJoined && !isOwner && (
                    <button
                        onClick={() => onLeave(match.id)}
                        style={{
                            flex: 1,
                            border: "1px solid rgba(239,68,68,.3)",
                            background: "rgba(239,68,68,.06)",
                            color: "#dc2626",
                            fontWeight: 700,
                            padding: "10px 12px",
                            borderRadius: 14,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            fontSize: 14,
                        }}
                    >
                        <LogOut size={15} /> Quitter
                    </button>
                )}

                {isOwner && match.status !== "CANCELLED" && (
                    <button
                        onClick={() => onCancel(match.id)}
                        style={{
                            flex: 1,
                            border: "1px solid rgba(239,68,68,.3)",
                            background: "rgba(239,68,68,.06)",
                            color: "#dc2626",
                            fontWeight: 700,
                            padding: "10px 12px",
                            borderRadius: 14,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            fontSize: 14,
                        }}
                    >
                        <X size={15} /> Annuler
                    </button>
                )}

                {/* Bouton Payer — visible seulement si participant/owner ET pas encore payé */}
                {(hasJoined || isOwner) && !currentUserHasPaid && match.status !== "CANCELLED" && (
                    <button
                        onClick={handlePayment}
                        style={{
                            flex: 1,
                            border: "1px solid rgba(99,102,241,.35)",
                            background: "linear-gradient(135deg, rgba(99,102,241,.12), rgba(99,102,241,.04))",
                            color: "#4338ca",
                            fontWeight: 700,
                            padding: "10px 12px",
                            borderRadius: 14,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            fontSize: 14,
                        }}
                    >
                        <CreditCard size={15} /> Payer ma part
                    </button>
                )}

                {/* Indication si déjà payé */}
                {(hasJoined || isOwner) && currentUserHasPaid && match.status !== "CANCELLED" && (
                    <div style={{
                        flex: 1,
                        border: "1px solid rgba(22,163,74,.25)",
                        background: "#f0fdf4",
                        color: "#166534",
                        fontWeight: 700,
                        padding: "10px 12px",
                        borderRadius: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        fontSize: 14,
                    }}>
                        ✅ Payé
                    </div>
                )}
            </div>
        </motion.article>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "available" | "my";

export default function MatchPage() {
    const [tab, setTab] = useState<Tab>("available");
    const [availableMatches, setAvailableMatches] = useState<Match[]>([]);
    const [myMatches, setMyMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getCurrentUserId = (): number | null => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return null;
            const payload = JSON.parse(atob(token.split(".")[1]));
            return Number(payload.sub);
        } catch {
            return null;
        }
    };

    const currentUserId = getCurrentUserId();

    // Set des IDs des matchs auxquels l'utilisateur participe
    const myMatchIds = new Set(myMatches.map((m) => m.id));

    const loadMyMatches = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) { setMyMatches([]); return; }
            const res = await getMyMatches();
            const data = res.data ?? res;
            setMyMatches(Array.isArray(data) ? data : []);
        } catch {
            setMyMatches([]);
        }
    };

    const loadAvailable = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getAvailableMatches();
            const data = res.data ?? res;
            setAvailableMatches(Array.isArray(data) ? data : []);
        } catch {
            setAvailableMatches([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAvailable();
        loadMyMatches();
    }, []);

    const navigate = useNavigate();

    const handleJoin = async (matchId: number) => {
        try {
            const res = await joinMatch(matchId);
            const data = res.data ?? res;

            // Rediriger vers le paiement obligatoire
            navigate("/payment", {
                state: {
                    matchId: data.matchId ?? matchId,
                    bookingId: data.bookingId,
                    amount: data.pricePerPlayer,
                    matchType: data.matchType,
                    courtName: data.courtName,
                    slotStartTime: data.slotStartTime,
                },
            });
        } catch (e: any) {
            setError(e.message || "Erreur lors de la tentative de rejoindre.");
        }
    };

    const handleLeave = async (matchId: number) => {
        try {
            await leaveMatch(matchId);
            await Promise.all([loadAvailable(), loadMyMatches()]);
        } catch (e: any) {
            setError(e.message || "Erreur lors du départ du match.");
        }
    };

    const handleCancel = async (matchId: number) => {
        try {
            await cancelMatch(matchId);
            await Promise.all([loadAvailable(), loadMyMatches()]);
        } catch (e: any) {
            setError(e.message || "Erreur lors de l'annulation.");
        }
    };

    const displayed = tab === "available" ? availableMatches : myMatches;

    return (
        <div className="page">
            {/* HERO */}
            <section
                style={{
                    position: "relative",
                    background: `linear-gradient(135deg, rgba(11,18,32,0.82) 0%, rgba(15,45,26,0.75) 100%), url('https://i.pinimg.com/1200x/cf/14/24/cf1424cb0ab6935b00fc2d745c47ae53.jpg') center/cover no-repeat`,
                    padding: "52px 20px 40px",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: -60,
                        right: -60,
                        width: 260,
                        height: 260,
                        borderRadius: "50%",
                        border: "1px solid rgba(22,163,74,.15)",
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: 20,
                        right: 20,
                        width: 160,
                        height: 160,
                        borderRadius: "50%",
                        border: "1px solid rgba(22,163,74,.1)",
                        pointerEvents: "none",
                    }}
                />

                <div style={{ maxWidth: 980, margin: "0 auto", position: "relative" }}>
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="badge" style={{ marginBottom: 12 }}>
                            🎾 AceArena — Matchs
                        </div>
                        <h1
                            style={{
                                margin: 0,
                                fontSize: "clamp(28px, 4vw, 48px)",
                                fontWeight: 800,
                                color: "#fff",
                                letterSpacing: -0.5,
                            }}
                        >
                            Trouve ton match
                        </h1>
                        <p style={{ color: "rgba(255,255,255,.7)", fontSize: 16, margin: "10px 0 0" }}>
                            Rejoins un match ouvert ou consulte tes matchs en cours.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* TABS */}
            <div style={{ background: "#fff", borderBottom: "1px solid rgba(15,23,42,.08)" }}>
                <div
                    style={{
                        maxWidth: 980,
                        margin: "0 auto",
                        padding: "0 20px",
                        display: "flex",
                        gap: 0,
                    }}
                >
                    {(["available", "my"] as Tab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                padding: "16px 20px",
                                background: "none",
                                border: "none",
                                borderBottom: tab === t ? "2px solid #16a34a" : "2px solid transparent",
                                color: tab === t ? "#16a34a" : "#64748b",
                                fontWeight: tab === t ? 700 : 500,
                                cursor: "pointer",
                                fontSize: 14,
                                transition: "all .2s",
                            }}
                        >
                            {t === "available"
                                ? `Matchs disponibles (${availableMatches.length})`
                                : `Mes matchs (${myMatches.length})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENT */}
            <main style={{ maxWidth: 980, margin: "0 auto", padding: "28px 20px 48px", flex: 1 }}>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#dc2626",
                            borderRadius: 12,
                            padding: "12px 16px",
                            marginBottom: 20,
                            fontSize: 14,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        {error}
                        <button
                            onClick={() => setError(null)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                )}

                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                        Chargement…
                    </div>
                ) : displayed.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 15 }}>
                        {tab === "available"
                            ? "Aucun match disponible pour le moment."
                            : "Vous n'avez pas encore de match."}
                    </div>
                ) : (
                    <motion.div
                        layout
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr",       // ← colonne unique
                            maxWidth: 560,                    // ← largeur centrée
                            margin: "0 auto",
                            gap: 18,
                        }}
                    >
                        <AnimatePresence>
                            {displayed.map((match) => (
                                <MatchCard
                                    key={match.id}
                                    match={match}
                                    myMatchIds={myMatchIds}
                                    onJoin={handleJoin}
                                    onLeave={handleLeave}
                                    onCancel={handleCancel}
                                    currentUserId={currentUserId}
                                    isMyTab={tab === "my"}  // ← fix boutons onglet "mes matchs"
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>

            {/* FOOTER */}
            <footer className="footer">
                © {new Date().getFullYear()} AceArena — Tous droits réservés
            </footer>

        </div>
    );
}