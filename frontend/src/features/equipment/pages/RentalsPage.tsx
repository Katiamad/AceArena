import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useEquipments } from "@/features/equipment/hooks/useEquipments";
import {
    useRentals,
    useCreateRental,
    useCancelRental,
    useReturnRental,
} from "../hooks/useRentals";
import type { RentalCreateRequest } from "../types";
import { NotificationApi } from "@/features/notification/notificationApi";
import toast from "react-hot-toast";

const getUserPayload = () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) return null;
        return JSON.parse(atob(token.split(".")[1]));
    } catch { return null; }
};

const EQUIPMENT_IMAGES: Record<string, string> = {
    raquette: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400",
    balle:    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400",
    machine:  "https://images.unsplash.com/photo-1526888935184-a82d2a4b7e67?w=400",
};

const EQUIPMENT_PRICES: Record<string, number> = {
    raquette: 8,
    balle: 3,
    machine: 20,
};

const CATEGORY_LABELS: Record<string, string> = {
    RAQUETTE: "Raquette",
    BALLE: "Balle",
    MACHINE: "Machine",
};

function getEquipmentImage(name: string): string {
    const lower = name?.toLowerCase() ?? "";
    if (lower.includes("bal")) return EQUIPMENT_IMAGES.balle;
    if (lower.includes("machine")) return EQUIPMENT_IMAGES.machine;
    return EQUIPMENT_IMAGES.raquette;
}

function getEquipmentPrice(name: string): number {
    const lower = name?.toLowerCase() ?? "";
    if (lower.includes("bal")) return EQUIPMENT_PRICES.balle;
    if (lower.includes("machine")) return EQUIPMENT_PRICES.machine;
    return EQUIPMENT_PRICES.raquette;
}

interface CartItem {
    equipmentId: number;
    equipmentName: string;
    quantity: number;
    price: number;
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; color: string; bg: string }> = {
        CREATED:  { label: "Active",      color: "#15803d", bg: "#f0fdf4" },
        RETURNED: { label: "Rendu",       color: "#1d4ed8", bg: "#eff6ff" },
        CANCELED: { label: "Annulé",      color: "#dc2626", bg: "#fef2f2" },
        PAID:     { label: "Payé",     color: "#7c3aed", bg: "#faf5ff" },
    };
    const c = config[status] ?? { label: status, color: "#6b7280", bg: "#f9fafb" };
    return (
        <span style={{
            padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
            color: c.color, background: c.bg, letterSpacing: 0.5,
            textTransform: "uppercase" as const, border: `1px solid ${c.color}33`,
        }}>{c.label}</span>
    );
}

export default function RentalsPage() {
    const navigate = useNavigate();
    const { data: rentals, isLoading } = useRentals();
    const createMutation = useCreateRental();
    const cancelMutation = useCancelRental();
    const returnMutation = useReturnRental();
    const { data: equipments } = useEquipments();

    const payload = getUserPayload();
    const currentUserId = Number(payload?.sub) || 1;

    // ── Filtres ──────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("ALL");
    const [filterAvailability, setFilterAvailability] = useState<string>("ALL");
    const [maxPrice, setMaxPrice] = useState(25);

    // ── Panier ───────────────────────────────────────────
    const [cart, setCart] = useState<CartItem[]>([]);

    // 👇 State pour tracker les équipements où l'user est déjà en waitlist
    const [waitlisted, setWaitlisted] = useState<Set<number>>(new Set());

    const handleNotifyMe = async (equipmentId: number) => {
        try {
            await NotificationApi.notifyMe(equipmentId);
            setWaitlisted(prev => new Set([...prev, equipmentId]));
            toast.success("🔔 Vous serez notifié quand cet équipement sera disponible !");
        } catch {
            toast.error("Erreur lors de l'inscription");
        }
    };



    const addToCart = (eq: { id: number; name: string; stockAvailable: number }) => {
        const price = getEquipmentPrice(eq.name);
        const existing = cart.find(c => c.equipmentId === eq.id);
        if (existing) {
            if (existing.quantity < eq.stockAvailable) {
                setCart(cart.map(c => c.equipmentId === eq.id
                    ? { ...c, quantity: c.quantity + 1 }
                    : c
                ));
            }
        } else {
            setCart([...cart, { equipmentId: eq.id, equipmentName: eq.name, quantity: 1, price }]);
        }
    };

    const removeFromCart = (equipmentId: number) => {
        setCart(cart.filter(c => c.equipmentId !== equipmentId));
    };

    const updateCartQty = (equipmentId: number, qty: number) => {
        if (qty <= 0) { removeFromCart(equipmentId); return; }
        setCart(cart.map(c => c.equipmentId === equipmentId ? { ...c, quantity: qty } : c));
    };

    const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
    const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

    const handleCheckout = () => {
        if (cart.length === 0) return;
        const req: RentalCreateRequest = {
            bookingId: 0,
            userId: currentUserId,
            clubId: 1,
            items: cart.map(c => ({ equipmentId: c.equipmentId, quantity: c.quantity })),
        };
        createMutation.mutate(req, {
            onSuccess: () => setCart([]),
        });
    };

    // ── Équipements filtrés ───────────────────────────────
    const filtered = useMemo(() => {
        return (equipments ?? []).filter(eq => {
            const matchSearch = eq.name.toLowerCase().includes(search.toLowerCase());
            const matchCat = filterCategory === "ALL" || (eq.category === filterCategory);
            const matchAvail = filterAvailability === "ALL"
                || (filterAvailability === "AVAILABLE" && eq.stockAvailable > 0)
                || (filterAvailability === "OUT" && eq.stockAvailable === 0);
            const matchPrice = getEquipmentPrice(eq.name) <= maxPrice;
            return matchSearch && matchCat && matchAvail && matchPrice;
        });
    }, [equipments, search, filterCategory, filterAvailability, maxPrice]);

    const popular = useMemo(() =>
            (equipments ?? []).filter(e => e.stockAvailable > 0).slice(0, 3),
        [equipments]);

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
                * { box-sizing: border-box; }
                .eq-card { transition: transform 0.22s ease, box-shadow 0.22s ease; cursor: pointer; }
                .eq-card:hover { transform: translateY(-5px); box-shadow: 0 20px 48px rgba(0,0,0,0.13) !important; }
                .eq-card:hover .rent-btn { opacity: 1 !important; transform: translateY(0) !important; }
                .rent-btn { transition: all 0.2s ease; }
                .rental-card { transition: box-shadow 0.2s; }
                .rental-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.09) !important; }
                .cart-item { transition: background 0.15s; }
                .cart-item:hover { background: #f0fdf4 !important; }
                .filter-btn { transition: all 0.15s; cursor: pointer; border: none; }
                .filter-btn:hover { background: #f0fdf4 !important; }
                .filter-btn.active { background: #16a34a !important; color: #fff !important; }
                input[type=range] { accent-color: #16a34a; }
                .star { color: #f59e0b; font-size: 13px; }
                .popular-badge { animation: pulse 2s infinite; }
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
                .fade-in { animation: fadeIn 0.4s ease both; }
                @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
                .add-anim { animation: addPop 0.3s ease; }
                @keyframes addPop { 0%{transform:scale(1)} 50%{transform:scale(1.12)} 100%{transform:scale(1)} }
            `}</style>

            {/* ── HERO ─────────────────────────────────────── */}
            <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
                <img src="https://i.pinimg.com/1200x/4d/cc/8f/4dcc8f3cd74b637125a2684dcb56aae1.jpg"
                     alt="Tennis court"
                     style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 35%" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)" }} />
                <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 56px", gap: 16 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(74,222,128,0.18)", border: "1px solid rgba(74,222,128,0.45)", borderRadius: 99, padding: "4px 14px", width: "fit-content", color: "#4ade80", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
                        🎾 AceArena
                    </div>
                    <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3.2rem)", color: "#fff", margin: 0, lineHeight: 1.1, textShadow: "0 2px 16px rgba(0,0,0,0.5)" }}>
                        Location d'Équipements
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.75)", margin: 0, fontSize: 15, fontWeight: 300, maxWidth: 480 }}>
                        Raquettes, balles et machines disponibles pour votre session de tennis
                    </p>
                    {/* Search bar dans le hero */}
                    <div style={{ display: "flex", alignItems: "center", background: "#fff", borderRadius: 12, padding: "10px 16px", gap: 10, maxWidth: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", marginTop: 4 }}>
                        <span style={{ fontSize: 16 }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher un équipement..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ border: "none", outline: "none", flex: 1, fontSize: 14, color: "#111", background: "transparent" }}
                        />
                        {search && (
                            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 16 }}>✕</button>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}>

                {/* ── ÉQUIPEMENTS POPULAIRES ──────────────── */}
                {popular.length > 0 && (
                    <section className="fade-in" style={{ marginBottom: 40 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                            <span className="popular-badge" style={{ fontSize: 18 }}>🔥</span>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#111", margin: 0, fontWeight: 700 }}>Équipements populaires</h2>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                            {popular.map(eq => (
                                <div key={eq.id} className="eq-card"
                                     style={{ borderRadius: 16, overflow: "hidden", background: "#fff", border: "2px solid #fbbf24", boxShadow: "0 4px 16px rgba(251,191,36,0.15)", position: "relative" }}>
                                    <div style={{ position: "absolute", top: 10, left: 10, zIndex: 2, background: "#fbbf24", color: "#78350f", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 99, letterSpacing: 1, textTransform: "uppercase" }}>⭐ Populaire</div>
                                    <div style={{ height: 140, overflow: "hidden", position: "relative" }}>
                                        <img src={getEquipmentImage(eq.name)} alt={eq.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)" }} />
                                        <div style={{ position: "absolute", bottom: 10, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{eq.name}</span>
                                            <span style={{ color: "#fbbf24", fontWeight: 800, fontSize: 16 }}>{getEquipmentPrice(eq.name)}€</span>
                                        </div>
                                    </div>
                                    <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ display: "flex", gap: 1 }}>
                                            {[1,2,3,4,5].map(s => <span key={s} className="star">★</span>)}
                                        </div>
                                        <button onClick={() => addToCart(eq)}
                                                style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                                            + Ajouter
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── LAYOUT PRINCIPAL : Filtres | Équipements | Panier ── */}
                <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 300px", gap: 24, alignItems: "start" }}>

                    {/* ── SIDEBAR FILTRES ─────────────────── */}
                    <aside style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "20px", position: "sticky", top: 80 }}>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#111", margin: "0 0 18px", fontWeight: 700 }}>Filtres</h3>

                        {/* Catégorie */}
                        <div style={{ marginBottom: 22 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Catégorie</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {["ALL", "RAQUETTE", "BALLE", "MACHINE"].map(cat => (
                                    <button key={cat} className={`filter-btn ${filterCategory === cat ? "active" : ""}`}
                                            onClick={() => setFilterCategory(cat)}
                                            style={{
                                                padding: "7px 12px", borderRadius: 8, fontSize: 13,
                                                textAlign: "left",
                                                background: filterCategory === cat ? "#16a34a" : "#f9fafb",
                                                color: filterCategory === cat ? "#fff" : "#374151",
                                                fontWeight: filterCategory === cat ? 700 : 400,
                                                border: filterCategory === cat ? "none" : "1px solid #e5e7eb",
                                            }}>
                                        {cat === "ALL" ? "Tous" : CATEGORY_LABELS[cat]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Disponibilité */}
                        <div style={{ marginBottom: 22 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Disponibilité</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {[
                                    { value: "ALL", label: "Tous" },
                                    { value: "AVAILABLE", label: "✅ Disponible" },
                                    { value: "OUT", label: "❌ Rupture" },
                                ].map(opt => (
                                    <button key={opt.value} className={`filter-btn ${filterAvailability === opt.value ? "active" : ""}`}
                                            onClick={() => setFilterAvailability(opt.value)}
                                            style={{
                                                padding: "7px 12px", borderRadius: 8, fontSize: 13,
                                                textAlign: "left",
                                                background: filterAvailability === opt.value ? "#16a34a" : "#f9fafb",
                                                color: filterAvailability === opt.value ? "#fff" : "#374151",
                                                fontWeight: filterAvailability === opt.value ? 700 : 400,
                                                border: filterAvailability === opt.value ? "none" : "1px solid #e5e7eb",
                                            }}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Prix max */}
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Prix max : <span style={{ color: "#16a34a" }}>{maxPrice}€</span></p>
                            <input type="range" min={1} max={25} value={maxPrice}
                                   onChange={e => setMaxPrice(Number(e.target.value))}
                                   style={{ width: "100%" }} />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                                <span>1€</span><span>25€</span>
                            </div>
                        </div>
                    </aside>

                    {/* ── LISTE ÉQUIPEMENTS ────────────────── */}
                    <section>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>{filtered.length} équipement{filtered.length !== 1 ? "s" : ""} trouvé{filtered.length !== 1 ? "s" : ""}</p>
                        </div>

                        {filtered.length === 0 && (
                            <div style={{ textAlign: "center", padding: 56, background: "#fff", borderRadius: 16, border: "2px dashed #e5e7eb" }}>
                                <div style={{ fontSize: 36, marginBottom: 8 }}>🎾</div>
                                <div style={{ color: "#6b7280", fontSize: 15 }}>Aucun équipement trouvé</div>
                                <div style={{ color: "#d1d5db", fontSize: 13, marginTop: 4 }}>Modifiez vos filtres</div>
                            </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
                            {filtered.map(eq => {
                                const price = getEquipmentPrice(eq.name);
                                const inCart = cart.find(c => c.equipmentId === eq.id);
                                const isOutOfStock = eq.stockAvailable === 0;
                                const stockPercent = Math.min(100, (eq.stockAvailable / (eq.stockTotal || 1)) * 100);

                                return (
                                    <div key={eq.id} className="eq-card fade-in"
                                         style={{ borderRadius: 16, overflow: "hidden", background: "#fff", border: inCart ? "2px solid #16a34a" : "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", opacity: isOutOfStock ? 0.7 : 1 }}>

                                        {/* Image */}
                                        <div style={{ position: "relative", height: 175, overflow: "hidden" }}>
                                            <img src={getEquipmentImage(eq.name)} alt={eq.name}
                                                 style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                                                 onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.07)")}
                                                 onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
                                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)" }} />

                                            {/* Bouton Louer maintenant / Me notifier */}
                                            <button className="rent-btn"
                                                    onClick={() => {
                                                        if (isOutOfStock) {
                                                            if (!waitlisted.has(eq.id)) handleNotifyMe(eq.id);
                                                        } else {
                                                            addToCart(eq);
                                                        }
                                                    }}
                                                    style={{
                                                        position: "absolute", bottom: 10, left: "50%", transform: "translateY(8px)",
                                                        marginLeft: "-70px", width: 140,
                                                        opacity: 0,
                                                        background: isOutOfStock
                                                            ? waitlisted.has(eq.id) ? "#6b7280" : "#f59e0b"
                                                            : "#16a34a",
                                                        color: "#fff", border: "none", borderRadius: 10,
                                                        padding: "8px 0", fontWeight: 700, fontSize: 13,
                                                        cursor: isOutOfStock && waitlisted.has(eq.id) ? "not-allowed" : "pointer",
                                                    }}>
                                                {isOutOfStock
                                                    ? waitlisted.has(eq.id) ? "✓ Notif activée" : "🔔 Me notifier"
                                                    : inCart ? "✓ Ajouté" : "Louer maintenant"}
                                            </button>

                                            {/* Badge dispo */}
                                            <div style={{
                                                position: "absolute", top: 10, right: 10,
                                                background: isOutOfStock ? "#fef2f2" : "#f0fdf4",
                                                color: isOutOfStock ? "#dc2626" : "#15803d",
                                                border: `1px solid ${isOutOfStock ? "#fecaca" : "#bbf7d0"}`,
                                                fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, letterSpacing: 0.5
                                            }}>
                                                {isOutOfStock ? "Rupture" : "Disponible"}
                                            </div>

                                            {/* Checkmark si dans panier */}
                                            {inCart && (
                                                <div style={{ position: "absolute", top: 10, left: 10, background: "#16a34a", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 13 }}>✓</div>
                                            )}
                                        </div>

                                        {/* Infos */}
                                        <div style={{ padding: "12px 14px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{eq.name}</div>
                                                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{CATEGORY_LABELS[eq.category] ?? eq.category}</div>
                                                </div>
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{ color: "#16a34a", fontWeight: 800, fontSize: 17, fontFamily: "'Playfair Display', serif" }}>{price}€</div>
                                                    <div style={{ fontSize: 10, color: "#9ca3af" }}>/session</div>
                                                </div>
                                            </div>

                                            {/* Stars */}
                                            <div style={{ display: "flex", gap: 1, marginBottom: 8 }}>
                                                {[1,2,3,4,5].map(s => <span key={s} className="star">★</span>)}
                                                <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 4 }}>(4.8)</span>
                                            </div>

                                            {/* Progress bar stock */}
                                            <div>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                                                    <span>Stock</span>
                                                    <span style={{ color: isOutOfStock ? "#dc2626" : "#16a34a", fontWeight: 600 }}>{eq.stockAvailable}/{eq.stockTotal}</span>
                                                </div>
                                                <div style={{ height: 5, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                                                    <div style={{ height: "100%", width: `${stockPercent}%`, background: stockPercent > 50 ? "#16a34a" : stockPercent > 20 ? "#f59e0b" : "#dc2626", borderRadius: 99, transition: "width 0.4s ease" }} />
                                                </div>
                                            </div>
                                            {/* 👇 Bouton Me notifier visible sous la card si rupture */}
                                            {isOutOfStock && (
                                                <button
                                                    onClick={() => !waitlisted.has(eq.id) && handleNotifyMe(eq.id)}
                                                    disabled={waitlisted.has(eq.id)}
                                                    style={{
                                                        marginTop: 10, width: "100%", padding: "7px", borderRadius: 9,
                                                        border: waitlisted.has(eq.id) ? "1px solid #e5e7eb" : "1px solid #fcd34d",
                                                        background: waitlisted.has(eq.id) ? "#f9fafb" : "#fffbeb",
                                                        color: waitlisted.has(eq.id) ? "#9ca3af" : "#92400e",
                                                        fontWeight: 700, fontSize: 12,
                                                        cursor: waitlisted.has(eq.id) ? "not-allowed" : "pointer",
                                                        transition: "all 0.15s",
                                                    }}>
                                                    {waitlisted.has(eq.id) ? "✓ Notification activée" : "🔔 Me notifier quand dispo"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── PANIER / CHECKOUT ───────────────── */}
                    <aside style={{ position: "sticky", top: 80 }}>
                        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
                            {/* Header panier */}
                            <div style={{ background: "#111827", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 16 }}>🛒</span>
                                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Mon panier</span>
                                </div>
                                {cartCount > 0 && (
                                    <span style={{ background: "#16a34a", color: "#fff", borderRadius: 99, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{cartCount}</span>
                                )}
                            </div>

                            {/* Items du panier */}
                            <div style={{ padding: "12px 16px", minHeight: 120 }}>
                                {cart.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "28px 0", color: "#9ca3af" }}>
                                        <div style={{ fontSize: 28, marginBottom: 8 }}>🎾</div>
                                        <div style={{ fontSize: 13 }}>Votre panier est vide</div>
                                        <div style={{ fontSize: 12, marginTop: 4, color: "#d1d5db" }}>Cliquez sur un équipement pour l'ajouter</div>
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        {cart.map(item => (
                                            <div key={item.equipmentId} className="cart-item"
                                                 style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px", borderRadius: 10, background: "#f9fafb" }}>
                                                <img src={getEquipmentImage(item.equipmentName)} alt={item.equipmentName}
                                                     style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", border: "1px solid #e5e7eb", flexShrink: 0 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, fontSize: 13, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.equipmentName}</div>
                                                    <div style={{ color: "#16a34a", fontSize: 12, fontWeight: 700 }}>{item.price}€ × {item.quantity}</div>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                                    <button onClick={() => updateCartQty(item.equipmentId, item.quantity - 1)}
                                                            style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                                                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 16, textAlign: "center" }}>{item.quantity}</span>
                                                    <button onClick={() => updateCartQty(item.equipmentId, item.quantity + 1)}
                                                            style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                                                </div>
                                                <button onClick={() => removeFromCart(item.equipmentId)}
                                                        style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16, padding: 2 }}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Summary */}
                            {cart.length > 0 && (
                                <div style={{ borderTop: "1px solid #e5e7eb", padding: "14px 16px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
                                        <span>Sous-total</span>
                                        <span>{cartTotal}€</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
                                        <span>Frais de service</span>
                                        <span style={{ color: "#16a34a" }}>Gratuit</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 17, color: "#111", margin: "12px 0", borderTop: "1px solid #e5e7eb", paddingTop: 12, fontFamily: "'Playfair Display', serif" }}>
                                        <span>Total</span>
                                        <span style={{ color: "#16a34a" }}>{cartTotal}€</span>
                                    </div>

                                    {/* Utilisateur */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f0fdf4", borderRadius: 10, marginBottom: 12, border: "1px solid #bbf7d0" }}>
                                        <span style={{ fontSize: 14 }}>👤</span>
                                        <div>
                                            <div style={{ fontSize: 12, color: "#6b7280" }}>Loué par</div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{payload?.firstName} {payload?.lastName}</div>
                                        </div>
                                    </div>

                                    <button onClick={handleCheckout}
                                            disabled={createMutation.isPending}
                                            style={{
                                                width: "100%", padding: "13px", borderRadius: 12,
                                                background: createMutation.isPending ? "#9ca3af" : "#16a34a",
                                                color: "#fff", border: "none", fontWeight: 800, fontSize: 15,
                                                cursor: createMutation.isPending ? "not-allowed" : "pointer",
                                                boxShadow: "0 4px 14px rgba(22,163,74,0.3)",
                                                transition: "all 0.2s",
                                            }}>
                                        {createMutation.isPending ? "⏳ En cours..." : `Confirmer la location — ${cartTotal}€`}
                                    </button>
                                    <button onClick={() => {
                                        if (cart.length === 0) return;
                                        const req: RentalCreateRequest = {
                                            bookingId: 0,
                                            userId: currentUserId,
                                            clubId: 1,
                                            items: cart.map(c => ({ equipmentId: c.equipmentId, quantity: c.quantity })),
                                        };
                                        createMutation.mutate(req, {
                                            onSuccess: (rental) => {
                                                setCart([]);
                                                navigate("/payment", {
                                                    state: { amount: cartTotal, rentalId: rental.id }
                                                });
                                            },
                                        });
                                    }}
                                            disabled={createMutation.isPending || cart.length === 0}
                                            style={{ width: "100%", padding: "10px", borderRadius: 12, background: "#1d4ed8", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 8 }}>
                                        {createMutation.isPending ? "⏳ Création..." : `💳 Payer ${cartTotal}€`}
                                    </button>

                                    {createMutation.isError && (
                                        <div style={{ marginTop: 10, padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 12 }}>
                                            ⚠️ Erreur lors de la création
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>
                </div>

                {/* ── HISTORIQUE DES LOCATIONS ─────────────── */}
                <section style={{ marginTop: 48 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#111", margin: 0, fontWeight: 700 }}>Mes Locations</h2>
                        <span style={{ background: "#f3f4f6", color: "#6b7280", borderRadius: 99, padding: "2px 12px", fontSize: 12, fontWeight: 700 }}>{rentals?.length ?? 0}</span>
                    </div>

                    {isLoading && (
                        <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
                            <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>Chargement…
                        </div>
                    )}

                    {!isLoading && (!rentals || rentals.length === 0) && (
                        <div style={{ textAlign: "center", padding: 56, background: "#fff", borderRadius: 16, border: "2px dashed #e5e7eb" }}>
                            <div style={{ fontSize: 42, marginBottom: 8 }}>📦</div>
                            <div style={{ color: "#6b7280", fontSize: 15 }}>Aucune location pour le moment</div>
                            <div style={{ color: "#d1d5db", fontSize: 13, marginTop: 4 }}>Ajoutez des équipements au panier pour commencer</div>
                        </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                        {rentals?.map((r, idx) => {
                            const rowTotal = r.items.reduce((sum, item) => sum + getEquipmentPrice(item.equipmentName) * item.quantity, 0);
                            return (
                                <div key={r.id} className="rental-card fade-in"
                                     style={{
                                         background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
                                         overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                                         animationDelay: `${idx * 0.05}s`,
                                     }}>
                                    {/* Image + overlay */}
                                    <div style={{ position: "relative", height: 110, overflow: "hidden" }}>
                                        <img src={getEquipmentImage(r.items[0]?.equipmentName ?? "")} alt=""
                                             style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, transparent 70%)" }} />
                                        <div style={{ position: "absolute", top: 10, left: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>#{r.id}</span>                                            <StatusBadge status={r.status} />
                                        </div>
                                        <div style={{ position: "absolute", bottom: 10, right: 12, color: "#fff", fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 20 }}>{rowTotal}€</div>
                                    </div>

                                    {/* Contenu */}
                                    <div style={{ padding: "14px 16px" }}>
                                        <div style={{ marginBottom: 10 }}>
                                            {r.items.map(item => (
                                                <div key={item.equipmentId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                                                    <span style={{ fontWeight: 600, color: "#111" }}>{item.equipmentName}</span>
                                                    <span style={{ color: "#9ca3af" }}>× {item.quantity} — {getEquipmentPrice(item.equipmentName) * item.quantity}€</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                            {r.status !== "CANCELED" && r.status !== "RETURNED" && (
                                                <button onClick={() => cancelMutation.mutate(r.id)}
                                                        style={{ flex: 1, padding: "7px", borderRadius: 9, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                                                    Annuler
                                                </button>
                                            )}
                                            {r.status !== "RETURNED" && r.status !== "CANCELED" && (
                                                <button onClick={() => returnMutation.mutate(r.id)}
                                                        style={{ flex: 1, padding: "7px", borderRadius: 9, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                                                    Retourner
                                                </button>
                                            )}
                                            {r.status !== "PAID" && (
                                                <button onClick={() => navigate("/payment", {
                                                    state: {
                                                        amount: rowTotal,
                                                        rentalId: r.id,
                                                        fromCart: false
                                                    }
                                                })}
                                                        style={{ flex: 1, padding: "7px", borderRadius: 9, border: "none", background: "#1d4ed8", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                                                    💳 Payer
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}