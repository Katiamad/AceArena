import { useState, useRef, useEffect, useCallback } from "react";
import { Routes, Route, NavLink, useLocation, useNavigate } from "react-router-dom";

import EquipmentsPage from "../features/equipment/pages/EquipmentsPage";
import RentalsPage from "../features/equipment/pages/RentalsPage";
import MatchPage from "@/features/match/pages/matchPage";
import Accueil from "@/features/auth/pages/Accueil.tsx";
import Auth from "@/features/auth/pages/Auth.tsx";
import PaymentPage from "@/features/payment/pages/PaymentPage.tsx";
import UserBookingPage from "@/features/booking/pages/UserBookingPage.tsx";
import AdminBookingPage from "@/features/booking/pages/AdminBookingPage.tsx";
import { NotificationApi } from "@/features/notification/notificationApi";
import type { Notification } from "@/features/notification/notificationApi";

// ─── Helpers JWT ──────────────────────────────────────────────────────────────

const getUserPayload = () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) return null;
        return JSON.parse(atob(token.split(".")[1]));
    } catch { return null; }
};

const getUserRole = (): string | null => {
    const payload = getUserPayload();
    return payload?.scope ?? payload?.role ?? null;
};

// ─── Nav links ────────────────────────────────────────────────────────────────

const getNavLinks = (isAdmin: boolean) => [
    { to: "/",           label: "🏠 Accueil" },
    { to: "/auth",       label: "👤 Mon compte" },
    { to: "/rentals",    label: "📦 Locations" },
    { to: "/match",      label: "🎾 Matchs" },
    isAdmin
        ? { to: "/admin/booking", label: "⚙️ Gestion terrains" }
        : { to: "/booking",       label: "📅 Réservation" },
    ...(isAdmin ? [{ to: "/equipments", label: "🎒 Équipements" }] : []),
];

// ─── Notification icon ────────────────────────────────────────────────────────

const getNotifIcon = (type: string) => {
    switch (type) {
        case "LOW_STOCK_ALERT":           return "⚠️";
        case "EQUIPMENT_RENTED":          return "📦";
        case "EQUIPMENT_PAID":            return "💳";
        case "STOCK_UPDATED":             return "🔄";
        case "EQUIPMENT_RETURN_REMINDER": return "⏰";
        case "PLAYER_JOINED_MATCH":       return "🎾";
        case "MATCH_COMPLETED":           return "🏆";
        case "MATCH_CANCELLED":           return "❌";
        case "MATCH_CREATED":             return "🎾";
        case "MATCH_FULL":                return "✅";
        case "MATCH_WAITING_PLAYERS":     return "⏳";
        case "MATCH_PAYMENT_PAID":        return "💳";
        case "MATCH_PAYMENT_FAILED":      return "❌";
        case "BOOKING_CONFIRMED":         return "✅";
        case "BOOKING_CANCELLED":         return "❌";
        default:                          return "🔔";
    }
};

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

function ProtectedRoute({ roles, children }: { roles: string[], children: React.ReactNode }) {
    const navigate = useNavigate();
    const role = getUserRole();

    useEffect(() => {
        if (!role || !roles.includes(role)) navigate("/");
    }, [role, roles, navigate]);

    if (!role || !roles.includes(role)) return null;
    return <>{children}</>;
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifs, setNotifs] = useState<Notification[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    const payload = getUserPayload();
    const role = getUserRole();
    const isAdmin = role?.includes("ADMIN") ?? false;
    const navLinks = getNavLinks(isAdmin);
    const unreadCount = notifs.filter(n => !n.read).length;

    const fetchNotifs = useCallback(async () => {
        if (!payload?.sub) return;
        try {
            const data = await NotificationApi.findByUser(Number(payload.sub));
            setNotifs(data);
        } catch (_e) { /* silencieux */ }
    }, [payload?.sub]);

    useEffect(() => {
        void fetchNotifs();
        const interval = setInterval(() => { void fetchNotifs(); }, 5000);
        return () => clearInterval(interval);
    }, [fetchNotifs]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Fermer les menus au changement de route — sans setState dans l'effect body,
    // on utilise des refs pour éviter le warning
    const menuOpenRef = useRef(menuOpen);
    const notifOpenRef = useRef(notifOpen);
    menuOpenRef.current = menuOpen;
    notifOpenRef.current = notifOpen;

    useEffect(() => {
        if (menuOpenRef.current) setMenuOpen(false);
        if (notifOpenRef.current) setNotifOpen(false);
    }, [location.pathname]);

    const markAllRead = async () => {
        for (const n of notifs.filter(x => !x.read)) {
            try { await NotificationApi.markAsRead(n.id); } catch (_e) { /* silencieux */ }
        }
        setNotifs(prev => prev.map(x => ({ ...x, read: true })));
    };

    return (
        <nav style={{
            display: "flex", alignItems: "center", padding: "0 24px", height: 60,
            background: "rgba(11, 18, 32, 0.97)", backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(74, 222, 128, 0.15)", position: "sticky",
            top: 0, zIndex: 100, boxShadow: "0 4px 24px rgba(0,0,0,.3)", gap: 16,
        }}>
            <style>{`
                @keyframes fadeSlideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
                @keyframes bellRing { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-15deg)} 40%{transform:rotate(15deg)} 60%{transform:rotate(-10deg)} 80%{transform:rotate(10deg)} }
                .bell-btn:hover .bell-icon { animation: bellRing 0.5s ease; }
                .notif-scroll::-webkit-scrollbar { width: 6px; }
                .notif-scroll::-webkit-scrollbar-track { background: transparent; }
                .notif-scroll::-webkit-scrollbar-thumb { background: rgba(74, 222, 128, 0.2); border-radius: 10px; }
                .notif-scroll::-webkit-scrollbar-thumb:hover { background: rgba(74, 222, 128, 0.4); }
            `}</style>

            {/* Burger */}
            <div ref={menuRef} style={{ position: "relative" }}>
                <button onClick={() => setMenuOpen(v => !v)} aria-label="Menu navigation"
                        style={{
                            background: menuOpen ? "rgba(74,222,128,0.12)" : "transparent",
                            border: "1px solid rgba(74,222,128,0.25)", borderRadius: 10,
                            padding: "7px 10px", cursor: "pointer", display: "flex",
                            flexDirection: "column", gap: 5, transition: "all 0.2s",
                        }}>
                    {[0, 1, 2].map(i => (
                        <span key={i} style={{
                            display: "block", width: 20, height: 2, borderRadius: 99,
                            background: "#4ade80", transition: "all 0.25s",
                            transform: menuOpen && i === 0 ? "rotate(45deg) translateY(7px)"
                                : menuOpen && i === 1 ? "scaleX(0)"
                                    : menuOpen && i === 2 ? "rotate(-45deg) translateY(-7px)" : "none",
                        }} />
                    ))}
                </button>

                {menuOpen && (
                    <div style={{
                        position: "absolute", top: "calc(100% + 10px)", left: 0,
                        background: "rgba(11,18,32,0.98)", border: "1px solid rgba(74,222,128,0.2)",
                        borderRadius: 14, padding: "8px", minWidth: 200,
                        boxShadow: "0 16px 40px rgba(0,0,0,0.5)", backdropFilter: "blur(16px)",
                        animation: "fadeSlideDown 0.18s ease",
                    }}>
                        {navLinks.map(({ to, label }) => {
                            const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
                            return (
                                <NavLink key={to} to={to} end={to === "/"}
                                         style={{
                                             display: "flex", alignItems: "center", gap: 10,
                                             textDecoration: "none",
                                             color: isActive ? "#4ade80" : "rgba(255,255,255,0.75)",
                                             fontWeight: isActive ? 700 : 400, fontSize: 14,
                                             padding: "9px 14px", borderRadius: 9,
                                             background: isActive ? "rgba(74,222,128,0.1)" : "transparent",
                                             transition: "all 0.15s",
                                         }}
                                >{label}</NavLink>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Logo */}
            <span style={{
                color: "#4ade80", fontWeight: 900, fontSize: 20, letterSpacing: 0.5,
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                userSelect: "none", cursor: "pointer",
            }} onClick={() => navigate("/")}>
                🎾 <span style={{ color: "#fff" }}>Ace</span><span style={{ color: "#4ade80" }}>Arena</span>
            </span>

            <div style={{ flex: 1 }} />

            {/* Cloche notifs */}
            <div ref={notifRef} style={{ position: "relative" }}>
                <button className="bell-btn" onClick={() => setNotifOpen(v => !v)}
                        style={{
                            background: notifOpen ? "rgba(74,222,128,0.12)" : "transparent",
                            border: "1px solid rgba(74,222,128,0.25)", borderRadius: 10,
                            width: 38, height: 38, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            position: "relative", transition: "all 0.2s",
                        }}>
                    <span className="bell-icon" style={{ fontSize: 17 }}>🔔</span>
                    {unreadCount > 0 && (
                        <span style={{
                            position: "absolute", top: 5, right: 5,
                            width: 16, height: 16, borderRadius: "50%",
                            background: "#ef4444", border: "2px solid rgba(11,18,32,0.97)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 9, fontWeight: 800, color: "#fff",
                        }}>{unreadCount}</span>
                    )}
                </button>

                {notifOpen && (
                    <div style={{
                        position: "absolute", top: "calc(100% + 10px)", right: 0,
                        background: "rgba(11,18,32,0.98)", border: "1px solid rgba(74,222,128,0.2)",
                        borderRadius: 14, width: 320,
                        boxShadow: "0 16px 40px rgba(0,0,0,0.5)", backdropFilter: "blur(16px)",
                        animation: "fadeSlideDown 0.18s ease", overflow: "hidden",
                    }}>
                        <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                            <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Notifications</span>
                            {unreadCount > 0 && (
                                <button onClick={() => { void markAllRead(); }} style={{ background: "transparent", border: "none", color: "#4ade80", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                                    Tout marquer lu
                                </button>
                            )}
                        </div>

                        <div className="notif-scroll" style={{ maxHeight: "380px", overflowY: "auto" }}>
                            {notifs.length === 0 ? (
                                <div style={{ padding: "30px 16px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                                    Aucune nouvelle notification
                                </div>
                            ) : (
                                notifs.map(n => (
                                    <div key={n.id}
                                         onClick={() => {
                                             if (!n.read) {
                                                 void NotificationApi.markAsRead(n.id).then(() => {
                                                     setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                                                 });
                                             }
                                         }}
                                         style={{
                                             padding: "12px 16px", cursor: "pointer",
                                             borderBottom: "1px solid rgba(255,255,255,0.05)",
                                             background: n.read ? "transparent" : "rgba(74,222,128,0.05)",
                                             transition: "background 0.2s"
                                         }}
                                    >
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                            {!n.read && (
                                                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", marginTop: 6, flexShrink: 0 }} />
                                            )}
                                            <div style={{ flex: 1, paddingLeft: n.read ? 17 : 0 }}>
                                                {n.title && (
                                                    <div style={{ color: "#4ade80", fontSize: 11, fontWeight: 700, marginBottom: 2 }}>
                                                        {getNotifIcon(n.type)} {n.title}
                                                    </div>
                                                )}
                                                <div style={{ color: n.read ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.4 }}>
                                                    {n.message}
                                                </div>
                                                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>
                                                    {new Date(n.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* User Profile */}
            {payload ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/auth")}>
                    <span style={{ color: "rgba(255,255,255,.65)", fontSize: 13 }}>{payload.firstName}</span>
                    <div style={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: "linear-gradient(135deg, #16a34a, #4ade80)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 14, color: "#fff",
                        boxShadow: "0 0 0 2px rgba(74,222,128,0.3)",
                    }}>{payload.firstName?.[0]?.toUpperCase() ?? "?"}</div>
                </div>
            ) : (
                <NavLink to="/auth" style={{
                    textDecoration: "none", color: "#4ade80", fontWeight: 700, fontSize: 13,
                    padding: "7px 16px", borderRadius: 9, border: "1px solid rgba(74,222,128,0.4)",
                    background: "rgba(74,222,128,0.08)", transition: "all 0.2s",
                }}>Se connecter</NavLink>
            )}
        </nav>
    );
}

// ─── App Main ─────────────────────────────────────────────────────────────────

export default function App() {
    return (
        <div style={{ minHeight: "100vh", background: "#f8f7f4" }}>
            <Navbar />
            <Routes>
                <Route path="/"              element={<Accueil />} />
                <Route path="/auth"          element={<Auth />} />
                <Route path="/rentals"       element={<RentalsPage />} />
                <Route path="/match"         element={<MatchPage />} />
                <Route path="/booking"       element={<UserBookingPage />} />
                <Route path="/payment"       element={<PaymentPage />} />
                <Route path="/equipments"    element={
                    <ProtectedRoute roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
                        <EquipmentsPage />
                    </ProtectedRoute>
                } />
                <Route path="/admin/booking" element={
                    <ProtectedRoute roles={["ROLE_ADMIN"]}>
                        <AdminBookingPage />
                    </ProtectedRoute>
                } />
            </Routes>
        </div>
    );
}