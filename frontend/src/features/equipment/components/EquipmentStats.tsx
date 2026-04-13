// EquipmentStats.tsx
import type { Equipment } from "../types";

interface Props {
    equipments: Equipment[];
    mostRented?: { equipmentName: string; totalRented: number } | null;
}

export default function EquipmentStats({ equipments, mostRented }: Props) {
    const total = equipments.length;
    const lowStock = equipments.filter(e => e.stockAvailable > 0 && e.stockAvailable <= 3).length;
    const outOfStock = equipments.filter(e => e.stockAvailable === 0).length;
    const active = equipments.filter(e => e.status === "ACTIVE").length;

    const stats = [
        {
            label: "Total équipements",
            value: total,
            icon: "📦",
            color: "#2563eb",
            bg: "#eff6ff",
            border: "#bfdbfe",
        },
        {
            label: "Stock faible",
            value: lowStock,
            icon: "⚠️",
            color: "#d97706",
            bg: "#fffbeb",
            border: "#fde68a",
        },
        {
            label: "Rupture de stock",
            value: outOfStock,
            icon: "❌",
            color: "#dc2626",
            bg: "#fef2f2",
            border: "#fecaca",
        },
        {
            label: "Actifs",
            value: active,
            icon: "✅",
            color: "#16a34a",
            bg: "#f0fdf4",
            border: "#bbf7d0",
        },
    ];

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 8 }}>
            {stats.map(s => (
                <div key={s.label} style={{
                    background: s.bg, border: `1px solid ${s.border}`,
                    borderRadius: 14, padding: "18px 20px",
                    display: "flex", alignItems: "center", gap: 14,
                }}>
                    <div style={{ fontSize: 28, flexShrink: 0 }}>{s.icon}</div>
                    <div>
                        <div style={{ fontSize: 11, color: s.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
                    </div>
                </div>
            ))}
            {mostRented && (
                <div style={{
                    background: "#faf5ff", border: "1px solid #e9d5ff",
                    borderRadius: 14, padding: "18px 20px",
                    display: "flex", alignItems: "center", gap: 14,
                    gridColumn: "span 4",
                }}>
                    <div style={{ fontSize: 28 }}>🏆</div>
                    <div>
                        <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>Plus loué</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#7c3aed" }}>{mostRented.equipmentName} <span style={{ fontSize: 13, fontWeight: 400, color: "#a78bfa" }}>— {mostRented.totalRented} locations</span></div>
                    </div>
                </div>
            )}
        </div>
    );
}