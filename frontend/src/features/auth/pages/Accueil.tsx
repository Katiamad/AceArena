import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Search, ChevronRight, Users, Calendar, Trophy } from "lucide-react";
import { http } from "@/api/http";
import { useNavigate } from "react-router-dom";
import "./Accueil.css";

interface Court {
    id: number;
    name: string;
    description?: string;
    pricePerHour: number;
    surface?: string;
    imageUrl?: string;
    location?: string;
    isAvailable: boolean;
    timeSlots: { id: number; isBooked: boolean }[];
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800";

const surfaceLabel: Record<string, string> = {
    Clay: "Terre battue",
    Hard: "Dur",
    Grass: "Gazon",
    Indoor: "Indoor",
};

export default function Accueil() {
    const [search, setSearch] = useState("");
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        http.get<Court[]>("booking/api/user/courts")
            .then(r => setCourts(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const filteredCourts = useMemo(() => {
        const s = search.trim().toLowerCase();
        if (!s) return courts;
        return courts.filter(c =>
            c.name.toLowerCase().includes(s) ||
            (c.location ?? "").toLowerCase().includes(s) ||
            (c.surface ?? "").toLowerCase().includes(s)
        );
    }, [search, courts]);

    const totalSlots = courts.reduce((s, c) => s + (c.timeSlots?.length ?? 0), 0);
    const availableSlots = courts.reduce((s, c) => s + (c.timeSlots?.filter(t => !t.isBooked).length ?? 0), 0);

    return (
        <div className="page">
            {/* HERO */}
            <section className="hero">
                <img className="heroBg" src="Tennis1.png" alt="" />
                <div className="heroOverlay" />

                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55 }}
                    className="heroContent"
                >
                    <div className="badge">🎾 AceArena</div>

                    <h1 className="heroTitle">
                        Ton club de tennis,<br />à portée de clic
                    </h1>
                    <p className="heroSubtitle">
                        Réserve un terrain, rejoins un match ou loue du matériel — tout au même endroit.
                    </p>

                    <div className="searchBar">
                        <Search size={18} className="searchIcon" />
                        <input
                            className="searchInput"
                            placeholder="Rechercher un terrain, une surface…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button className="primaryBtn" type="button" onClick={() => navigate("/booking")}>
                            Réserver
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="heroStats">
                        <div className="heroStat">
                            <Trophy size={18} />
                            <div>
                                <span className="heroStatNum">{courts.length}</span>
                                <span className="heroStatLabel">Terrains</span>
                            </div>
                        </div>
                        <div className="heroStat">
                            <Calendar size={18} />
                            <div>
                                <span className="heroStatNum">{availableSlots}</span>
                                <span className="heroStatLabel">Créneaux libres</span>
                            </div>
                        </div>
                        <div className="heroStat">
                            <Users size={18} />
                            <div>
                                <span className="heroStatNum">{totalSlots - availableSlots}</span>
                                <span className="heroStatLabel">Réservations</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* QUICK ACTIONS */}
            <section className="quickActions">
                <div className="quickActionsInner">
                    {[
                        { icon: "📅", title: "Réserver", desc: "Choisis un terrain et un créneau", to: "/booking" },
                        { icon: "🎾", title: "Matchs", desc: "Rejoins un match ouvert", to: "/match" },
                        { icon: "📦", title: "Locations", desc: "Loue du matériel sportif", to: "/rentals" },
                    ].map((action, i) => (
                        <motion.div
                            key={action.to}
                            className="quickAction"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.08 }}
                            onClick={() => navigate(action.to)}
                        >
                            <span className="quickActionIcon">{action.icon}</span>
                            <div>
                                <div className="quickActionTitle">{action.title}</div>
                                <div className="quickActionDesc">{action.desc}</div>
                            </div>
                            <ChevronRight size={18} className="quickActionArrow" />
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* COURTS LIST */}
            <main className="container">
                <div className="sectionHeader">
                    <h2 className="sectionTitle">Nos terrains</h2>
                    <p className="sectionDesc">
                        {filteredCourts.length} terrain{filteredCourts.length > 1 ? "s" : ""} disponible{filteredCourts.length > 1 ? "s" : ""}
                    </p>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 15 }}>
                        Chargement des terrains…
                    </div>
                ) : filteredCourts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🎾</div>
                        <p style={{ fontSize: 15 }}>Aucun terrain trouvé.</p>
                    </div>
                ) : (
                    <div className="grid">
                        {filteredCourts.map((court, index) => {
                            const freeSlots = court.timeSlots?.filter(s => !s.isBooked).length ?? 0;
                            return (
                                <motion.article
                                    key={court.id}
                                    className="card"
                                    initial={{ opacity: 0, y: 22 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.06, duration: 0.4 }}
                                    viewport={{ once: true }}
                                    onClick={() => navigate("/booking")}
                                >
                                    <div className="cardImgWrap">
                                        <img
                                            className="cardImg"
                                            src={court.imageUrl || DEFAULT_IMAGE}
                                            alt={court.name}
                                            onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                                        />
                                        {court.surface && (
                                            <span className="cardSurfaceBadge">
                                                {surfaceLabel[court.surface] ?? court.surface}
                                            </span>
                                        )}
                                    </div>

                                    <div className="cardBody">
                                        <h3 className="cardTitle">{court.name}</h3>
                                        {court.description && (
                                            <p className="cardDesc">{court.description}</p>
                                        )}

                                        <div className="meta">
                                            {court.location && (
                                                <div className="metaItem">
                                                    <MapPin size={14} />
                                                    <span>{court.location}</span>
                                                </div>
                                            )}
                                            <div className="metaItem">
                                                <Clock size={14} />
                                                <span>{freeSlots} créneau{freeSlots > 1 ? "x" : ""} libre{freeSlots > 1 ? "s" : ""}</span>
                                            </div>
                                        </div>

                                        <div className="cardFooter">
                                            <span className="cardPrice">{court.pricePerHour}€<span>/h</span></span>
                                            <button className="secondaryBtn">
                                                Réserver <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* FOOTER */}
            <footer className="footer">
                © {new Date().getFullYear()} AceArena — Tous droits réservés
            </footer>
        </div>
    );
}
