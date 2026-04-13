// EquipmentsPage.tsx
import { useState, useMemo } from "react";
import {
    useEquipments,
    useCreateEquipment,
    useUpdateEquipment,
} from "../hooks/useEquipments";
import type { EquipmentCreateRequest, EquipmentCategory } from "../types";
import { useApiError } from "@/shared/hooks/useApiError";
import toast from "react-hot-toast";
import EquipmentStats from "../components/EquipmentStats";
import { http } from "@/api/http";
import { useQuery } from "@tanstack/react-query";

const EQUIPMENT_IMAGES: Record<string, string> = {
    raquette: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400",
    balle:    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400",
    machine:  "https://images.unsplash.com/photo-1526888935184-a82d2a4b7e67?w=400",
};

function getEquipmentImage(name: string): string {
    const lower = name?.toLowerCase() ?? "";
    if (lower.includes("bal")) return EQUIPMENT_IMAGES.balle;
    if (lower.includes("machine")) return EQUIPMENT_IMAGES.machine;
    return EQUIPMENT_IMAGES.raquette;
}

const CATEGORY_LABELS: Record<string, string> = {
    RAQUETTE: "Raquette",
    BALLE: "Balle",
    MACHINE: "Machine",
};

type SortKey = "name" | "category" | "stockAvailable" | "status";

export default function EquipmentsPage() {
    const { data, isLoading, isError, error } = useEquipments();
    const createMutation = useCreateEquipment();
    const updateMutation = useUpdateEquipment();
    const { getMessage } = useApiError();

    // Most rented
    const { data: mostRentedData } = useQuery({
        queryKey: ["most-rented"],
        queryFn: async () => {
            const { data } = await http.get("/equipment/api/rentals/stats/most-rented");
            return data;
        },
    });
    const mostRented = mostRentedData?.[0] ?? null;

    // Filtres
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortAsc, setSortAsc] = useState(true);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 8;

    // Bulk select
    const [selected, setSelected] = useState<Set<number>>(new Set());

    // Inline edit
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<any>(null);

    // Create form
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState<EquipmentCreateRequest>({
        clubId: 1, name: "", category: "RAQUETTE", stockTotal: 10, stockAvailable: 10,
    });

    const handleSubmit = () => {
        createMutation.mutate(form, {
            onSuccess: () => { toast.success("Équipement créé ✓"); setShowCreate(false); setForm({ clubId: 1, name: "", category: "RAQUETTE", stockTotal: 10, stockAvailable: 10 }); },
            onError: (err) => toast.error(getMessage(err)),
        });
    };

    const handleInlineEdit = (e: any) => {
        setEditingId(e.id);
        setEditForm({ name: e.name, category: e.category, stockTotal: e.stockTotal, stockAvailable: e.stockAvailable, status: e.status, version: e.version, clubId: e.clubId });
    };

    const handleInlineSave = (e: any) => {
        updateMutation.mutate({ id: e.id, data: editForm }, {
            onSuccess: () => { toast.success("Modifié ✓"); setEditingId(null); },
            onError: (err) => toast.error(getMessage(err)),
        });
    };

    const handleRestock = (e: any, amount: number) => {
        updateMutation.mutate({
            id: e.id,
            data: { name: e.name, category: e.category, stockTotal: e.stockTotal + amount, stockAvailable: e.stockAvailable + amount, status: e.status, version: e.version, clubId: e.clubId ?? undefined },
        }, {
            onSuccess: () => toast.success(`+${amount} stock ajouté ✓`),
            onError: (err) => toast.error(getMessage(err)),
        });
    };

    const handleToggleStatus = (e: any) => {
        const newStatus = e.status === "ACTIVE" ? "OUT_OF_SERVICE" : "ACTIVE";
        updateMutation.mutate({
            id: e.id,
            data: { name: e.name, category: e.category, stockTotal: e.stockTotal, stockAvailable: e.stockAvailable, status: newStatus, version: e.version, clubId: e.clubId ?? undefined },
        }, {
            onSuccess: () => toast.success(`Statut mis à jour ✓`),
            onError: (err) => toast.error(getMessage(err)),
        });
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else { setSortKey(key); setSortAsc(true); }
        setPage(1);
    };

    const toggleSelect = (id: number) => {
        const next = new Set(selected);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelected(next);
    };

    const toggleSelectAll = () => {
        if (selected.size === filtered?.length) setSelected(new Set());
        else setSelected(new Set(filtered?.map(e => e.id) ?? []));
    };

    // Low stock alerts
    const lowStockItems = data?.filter(e => e.stockAvailable > 0 && e.stockAvailable <= 3) ?? [];

    const filtered = useMemo(() => {
        let list = data?.filter(e => {
            const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
            const matchCat = categoryFilter === "ALL" || e.category === categoryFilter;
            const matchStatus = statusFilter === "ALL" || e.status === statusFilter;
            return matchSearch && matchCat && matchStatus;
        }) ?? [];

        list = [...list].sort((a, b) => {
            let va = a[sortKey] ?? "";
            let vb = b[sortKey] ?? "";
            if (typeof va === "string") va = va.toLowerCase();
            if (typeof vb === "string") vb = vb.toLowerCase();
            if (va < vb) return sortAsc ? -1 : 1;
            if (va > vb) return sortAsc ? 1 : -1;
            return 0;
        });

        return list;
    }, [data, search, categoryFilter, statusFilter, sortKey, sortAsc]);

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const SortIcon = ({ k }: { k: SortKey }) => (
        <span style={{ marginLeft: 4, opacity: sortKey === k ? 1 : 0.3, fontSize: 11 }}>
            {sortKey === k ? (sortAsc ? "▲" : "▼") : "↕"}
        </span>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
                * { box-sizing: border-box; }
                .th-btn { background: none; border: none; cursor: pointer; font-weight: 700; font-size: 13px; color: #374151; padding: 0; display: flex; align-items: center; }
                .th-btn:hover { color: #16a34a; }
                .action-btn { border: none; border-radius: 7px; padding: 5px 11px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
                .action-btn:hover { filter: brightness(0.93); transform: translateY(-1px); }
                .tr-row { transition: background 0.15s; }
                .tr-row:hover { background: #f8fafc !important; }
                .bulk-bar { animation: slideDown 0.2s ease; }
                @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
            `}</style>

            {/* ── HEADER ─────────────────────────────────── */}
            <div style={{ background: "#111827", padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ color: "#4ade80", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>🎾 AceArena Admin</div>
                    <h1 style={{ color: "#fff", margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900 }}>Equipment Dashboard</h1>
                </div>
                <button onClick={() => setShowCreate(!showCreate)}
                        style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(22,163,74,0.3)", display: "flex", alignItems: "center", gap: 8 }}>
                    {showCreate ? "✕ Fermer" : "＋ Nouvel équipement"}
                </button>
            </div>

            <div style={{ maxWidth: 1300, margin: "0 auto", padding: "28px 32px 60px" }}>

                {/* ── STATS ────────────────────────────────── */}
                {data && <EquipmentStats equipments={data} mostRented={mostRented} />}

                {/* ── LOW STOCK ALERT ──────────────────────── */}
                {lowStockItems.length > 0 && (
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 16, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 24, flexShrink: 0 }}>⚠️</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, color: "#92400e", fontSize: 15, marginBottom: 6 }}>Alerte stock faible — {lowStockItems.length} équipement{lowStockItems.length > 1 ? "s" : ""}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {lowStockItems.map(e => (
                                    <span key={e.id} style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "4px 12px", fontSize: 12, color: "#92400e", fontWeight: 600 }}>
                                        {e.name} — {e.stockAvailable} restant{e.stockAvailable > 1 ? "s" : ""}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => lowStockItems.forEach(e => handleRestock(e, 5))}
                                style={{ background: "#f59e0b", color: "#fff", border: "none", borderRadius: 9, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}>
                            📦 Restock tout (+5)
                        </button>
                    </div>
                )}

                {/* ── CREATE FORM ──────────────────────────── */}
                {showCreate && (
                    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "24px 28px", marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#111", margin: "0 0 20px", fontWeight: 700 }}>Nouvel équipement</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
                            {[
                                { label: "Nom", field: "name", type: "text", placeholder: "Wilson Pro" },
                                { label: "Stock total", field: "stockTotal", type: "number" },
                                { label: "Stock disponible", field: "stockAvailable", type: "number" },
                            ].map(f => (
                                <div key={f.field}>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{f.label}</label>
                                    <input type={f.type} placeholder={f.placeholder ?? ""}
                                           value={(form as any)[f.field]}
                                           onChange={e => setForm(prev => ({ ...prev, [f.field]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                                           style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none" }} />
                                </div>
                            ))}
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Catégorie</label>
                                <select value={form.category}
                                        onChange={e => setForm(prev => ({ ...prev, category: e.target.value as EquipmentCategory }))}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none" }}>
                                    <option value="RAQUETTE">Raquette</option>
                                    <option value="BALLE">Balle</option>
                                    <option value="MACHINE">Machine</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
                            <button onClick={handleSubmit} disabled={createMutation.isPending}
                                    style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: createMutation.isPending ? 0.7 : 1 }}>
                                {createMutation.isPending ? "Création..." : "✓ Créer l'équipement"}
                            </button>
                            <button onClick={() => setShowCreate(false)}
                                    style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                                Annuler
                            </button>
                        </div>
                    </div>
                )}

                {/* ── FILTRES + RECHERCHE ───────────────────── */}
                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "16px 20px", marginBottom: 16, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200, background: "#f9fafb", borderRadius: 9, border: "1px solid #e5e7eb", padding: "9px 13px" }}>
                        <span style={{ fontSize: 15 }}>🔍</span>
                        <input placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                               style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, flex: 1 }} />
                    </div>
                    {["ALL", "RAQUETTE", "BALLE", "MACHINE"].map(cat => (
                        <button key={cat} onClick={() => { setCategoryFilter(cat); setPage(1); }}
                                style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid #e5e7eb", fontWeight: categoryFilter === cat ? 700 : 400, fontSize: 13, cursor: "pointer", background: categoryFilter === cat ? "#16a34a" : "#f9fafb", color: categoryFilter === cat ? "#fff" : "#374151", transition: "all 0.15s" }}>
                            {cat === "ALL" ? "Tous" : CATEGORY_LABELS[cat]}
                        </button>
                    ))}
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                            style={{ padding: "9px 13px", borderRadius: 9, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", background: "#f9fafb", color: "#374151" }}>
                        <option value="ALL">Tous statuts</option>
                        <option value="ACTIVE">Actif</option>
                        <option value="OUT_OF_SERVICE">Hors service</option>
                        <option value="MAINTENANCE">Maintenance</option>
                    </select>
                    <span style={{ color: "#9ca3af", fontSize: 13, marginLeft: "auto" }}>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
                </div>

                {/* ── BULK ACTIONS ─────────────────────────── */}
                {selected.size > 0 && (
                    <div className="bulk-bar" style={{ background: "#111827", borderRadius: 12, padding: "12px 20px", marginBottom: 12, display: "flex", alignItems: "center", gap: 14 }}>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</span>
                        <button onClick={() => { selected.forEach(id => { const e = data?.find(x => x.id === id); if (e) handleRestock(e, 5); }); setSelected(new Set()); }}
                                style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                            📦 Restock +5
                        </button>
                        <button onClick={() => { selected.forEach(id => { const e = data?.find(x => x.id === id); if (e) handleToggleStatus(e); }); setSelected(new Set()); }}
                                style={{ background: "#f59e0b", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                            ⚡ Toggle statut
                        </button>
                        <button onClick={() => setSelected(new Set())}
                                style={{ background: "transparent", color: "#9ca3af", border: "1px solid #374151", borderRadius: 8, padding: "6px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer", marginLeft: "auto" }}>
                            Désélectionner
                        </button>
                    </div>
                )}

                {/* ── TABLE ────────────────────────────────── */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                    {isLoading && <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>⏳ Chargement...</div>}
                    {isError && <div style={{ padding: 24, background: "#fef2f2", color: "#dc2626" }}>{getMessage(error)}</div>}

                    {!isLoading && (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                                <th style={{ padding: "13px 16px", width: 40 }}>
                                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                                           onChange={toggleSelectAll} style={{ cursor: "pointer" }} />
                                </th>
                                <th style={{ padding: "13px 8px", width: 60, textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 700 }}>IMG</th>
                                <th style={{ padding: "13px 8px", textAlign: "left" }}>
                                    <button className="th-btn" onClick={() => handleSort("name")}>Nom <SortIcon k="name" /></button>
                                </th>
                                <th style={{ padding: "13px 8px", textAlign: "left" }}>
                                    <button className="th-btn" onClick={() => handleSort("category")}>Catégorie <SortIcon k="category" /></button>
                                </th>
                                <th style={{ padding: "13px 8px", textAlign: "left" }}>
                                    <button className="th-btn" onClick={() => handleSort("stockAvailable")}>Stock <SortIcon k="stockAvailable" /></button>
                                </th>
                                <th style={{ padding: "13px 8px", textAlign: "left" }}>
                                    <button className="th-btn" onClick={() => handleSort("status")}>Statut <SortIcon k="status" /></button>
                                </th>
                                <th style={{ padding: "13px 16px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 700 }}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginated.map((e, idx) => {
                                const isEditing = editingId === e.id;
                                const stockPercent = Math.min(100, (e.stockAvailable / (e.stockTotal || 1)) * 100);
                                const stockColor = stockPercent > 50 ? "#16a34a" : stockPercent > 20 ? "#f59e0b" : "#dc2626";

                                return (
                                    <tr key={e.id} className="tr-row"
                                        style={{ borderBottom: "1px solid #f3f4f6", background: selected.has(e.id) ? "#f0fdf4" : idx % 2 === 0 ? "#fff" : "#fafafa" }}>

                                        {/* Checkbox */}
                                        <td style={{ padding: "12px 16px" }}>
                                            <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} style={{ cursor: "pointer" }} />
                                        </td>

                                        {/* Image */}
                                        <td style={{ padding: "12px 8px" }}>
                                            <img src={getEquipmentImage(e.name)} alt={e.name}
                                                 style={{ width: 44, height: 44, borderRadius: 9, objectFit: "cover", border: "1px solid #e5e7eb" }} />
                                        </td>

                                        {/* Nom */}
                                        <td style={{ padding: "12px 8px" }}>
                                            {isEditing ? (
                                                <input value={editForm.name} onChange={ev => setEditForm({ ...editForm, name: ev.target.value })}
                                                       style={{ padding: "6px 10px", borderRadius: 7, border: "1.5px solid #16a34a", fontSize: 13, outline: "none", width: 140 }} />
                                            ) : (
                                                <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{e.name}</span>
                                            )}
                                        </td>

                                        {/* Catégorie */}
                                        <td style={{ padding: "12px 8px" }}>
                                            {isEditing ? (
                                                <select value={editForm.category} onChange={ev => setEditForm({ ...editForm, category: ev.target.value })}
                                                        style={{ padding: "6px 10px", borderRadius: 7, border: "1.5px solid #16a34a", fontSize: 13, outline: "none" }}>
                                                    <option value="RAQUETTE">Raquette</option>
                                                    <option value="BALLE">Balle</option>
                                                    <option value="MACHINE">Machine</option>
                                                </select>
                                            ) : (
                                                <span style={{ background: "#f3f4f6", color: "#374151", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                                                        {CATEGORY_LABELS[e.category] ?? e.category}
                                                    </span>
                                            )}
                                        </td>

                                        {/* Stock */}
                                        <td style={{ padding: "12px 8px", minWidth: 140 }}>
                                            {isEditing ? (
                                                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                    <input type="number" value={editForm.stockAvailable}
                                                           onChange={ev => setEditForm({ ...editForm, stockAvailable: Number(ev.target.value) })}
                                                           style={{ padding: "5px 8px", borderRadius: 7, border: "1.5px solid #16a34a", fontSize: 13, outline: "none", width: 60 }} />
                                                    <span style={{ color: "#9ca3af" }}>/</span>
                                                    <input type="number" value={editForm.stockTotal}
                                                           onChange={ev => setEditForm({ ...editForm, stockTotal: Number(ev.target.value) })}
                                                           style={{ padding: "5px 8px", borderRadius: 7, border: "1.5px solid #16a34a", fontSize: 13, outline: "none", width: 60 }} />
                                                </div>
                                            ) : (
                                                <div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                                                        <span style={{ color: stockColor, fontWeight: 700 }}>{e.stockAvailable}</span>
                                                        <span style={{ color: "#9ca3af" }}>/{e.stockTotal}</span>
                                                    </div>
                                                    <div style={{ height: 5, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                                                        <div style={{ height: "100%", width: `${stockPercent}%`, background: stockColor, borderRadius: 99, transition: "width 0.4s" }} />
                                                    </div>
                                                    {/* Inline +/- */}
                                                    <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
                                                        <button className="action-btn" onClick={() => handleRestock(e, -1)}
                                                                style={{ background: "#fef2f2", color: "#dc2626", padding: "2px 8px" }}>−</button>
                                                        <button className="action-btn" onClick={() => handleRestock(e, 1)}
                                                                style={{ background: "#f0fdf4", color: "#16a34a", padding: "2px 8px" }}>+</button>
                                                        <button className="action-btn" onClick={() => handleRestock(e, 5)}
                                                                style={{ background: "#eff6ff", color: "#2563eb", padding: "2px 8px", fontSize: 11 }}>+5</button>
                                                    </div>
                                                </div>
                                            )}
                                        </td>

                                        {/* Statut */}
                                        <td style={{ padding: "12px 8px" }}>
                                                <span style={{
                                                    padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                                                    background: e.status === "ACTIVE" ? "#f0fdf4" : "#fef2f2",
                                                    color: e.status === "ACTIVE" ? "#15803d" : "#dc2626",
                                                    border: `1px solid ${e.status === "ACTIVE" ? "#bbf7d0" : "#fecaca"}`,
                                                }}>
                                                    {e.status === "ACTIVE" ? "✅ Actif" : "❌ " + e.status}
                                                </span>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                {isEditing ? (
                                                    <>
                                                        <button className="action-btn" onClick={() => handleInlineSave(e)}
                                                                style={{ background: "#16a34a", color: "#fff" }}>✓ Sauver</button>
                                                        <button className="action-btn" onClick={() => setEditingId(null)}
                                                                style={{ background: "#f3f4f6", color: "#374151" }}>Annuler</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button className="action-btn" onClick={() => handleInlineEdit(e)}
                                                                style={{ background: "#eff6ff", color: "#2563eb" }}>✏️ Éditer</button>
                                                        <button className="action-btn" onClick={() => handleToggleStatus(e)}
                                                                style={{ background: e.status === "ACTIVE" ? "#fef2f2" : "#f0fdf4", color: e.status === "ACTIVE" ? "#dc2626" : "#16a34a" }}>
                                                            {e.status === "ACTIVE" ? "❌ Désactiver" : "✅ Activer"}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── PAGINATION ───────────────────────────── */}
                {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                style={{ padding: "7px 14px", borderRadius: 9, border: "1px solid #e5e7eb", background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#d1d5db" : "#374151", fontWeight: 600, fontSize: 13 }}>
                            ← Précédent
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setPage(p)}
                                    style={{ width: 36, height: 36, borderRadius: 9, border: "1px solid #e5e7eb", background: page === p ? "#16a34a" : "#fff", color: page === p ? "#fff" : "#374151", fontWeight: page === p ? 700 : 400, fontSize: 13, cursor: "pointer" }}>
                                {p}
                            </button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                style={{ padding: "7px 14px", borderRadius: 9, border: "1px solid #e5e7eb", background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#d1d5db" : "#374151", fontWeight: 600, fontSize: 13 }}>
                            Suivant →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}