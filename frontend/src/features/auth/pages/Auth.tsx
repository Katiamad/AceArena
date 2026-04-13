import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { apiLogin, apiMe, apiRegister, apiUpdateProfile, apiChangePassword, apiLogout } from "../api/auth.ts";
import { clearUserId, getUserId, setUserId } from "../session.ts";
import "./Auth.css";

type Me = {
    id: number; email: string; nom: string; role?: string;
};

const getJwtPayload = () => {
    try { const t = localStorage.getItem("token"); if (!t) return null; return JSON.parse(atob(t.split(".")[1])); }
    catch { return null; }
};

// ─── Section éditable ─────────────────────────────────────────────────────────
function EditField({ label, value, onSave, type = "text", placeholder }: {
    label: string; value: string; onSave: (v: string) => Promise<void>; type?: string; placeholder?: string;
}) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(value);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const save = async () => {
        if (!val.trim() || val === value) { setEditing(false); return; }
        setLoading(true); setErr(null);
        try { await onSave(val); setEditing(false); }
        catch (e: unknown) { setErr((e as Error)?.message ?? "Erreur"); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ borderBottom: "1px solid rgba(15,23,42,0.07)", padding: "16px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "#94a3b8", marginBottom: 4 }}>{label}</div>
                {editing ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input
                            type={type} value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} autoFocus
                            style={{ flex: 1, minWidth: 200, padding: "9px 12px", border: "1.5px solid #334155", borderRadius: 9, fontSize: 14, color: "#0f172a", background: "#f8fafc", outline: "none", fontFamily: "inherit" }}
                            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setEditing(false); setVal(value); } }}
                        />
                        <button onClick={save} disabled={loading} style={{ padding: "9px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            {loading ? "…" : "Enregistrer"}
                        </button>
                        <button onClick={() => { setEditing(false); setVal(value); }} style={{ padding: "9px 14px", background: "transparent", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                            Annuler
                        </button>
                    </div>
                ) : (
                    <div style={{ fontSize: 15, color: "#0f172a", fontWeight: 500 }}>{type === "password" ? "••••••••" : (value || <span style={{ color: "#94a3b8" }}>Non renseigné</span>)}</div>
                )}
                {err && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{err}</div>}
            </div>
            {!editing && (
                <button onClick={() => setEditing(true)} style={{ padding: "7px 14px", background: "transparent", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s", whiteSpace: "nowrap" }}>
                    Modifier
                </button>
            )}
        </div>
    );
}

// ─── Modifier mot de passe ────────────────────────────────────────────────────
function PasswordSection({ userId }: { userId: number }) {
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

    const save = async () => {
        if (next !== confirm) { setMsg({ text: "Les mots de passe ne correspondent pas.", ok: false }); return; }
        if (next.length < 6) { setMsg({ text: "Minimum 6 caractères.", ok: false }); return; }
        setLoading(true); setMsg(null);
        try {
            await apiChangePassword(userId, current, next);
            setMsg({ text: "Mot de passe modifié avec succès.", ok: true });
            setCurrent(""); setNext(""); setConfirm(""); setOpen(false);
        } catch (e: unknown) { setMsg({ text: (e as Error)?.message ?? "Erreur", ok: false }); }

        finally { setLoading(false); }
    };

    return (
        <div style={{ borderBottom: "1px solid rgba(15,23,42,0.07)", padding: "16px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "#94a3b8", marginBottom: 4 }}>Mot de passe</div>
                    <div style={{ fontSize: 15, color: "#0f172a", fontWeight: 500 }}>••••••••</div>
                </div>
                <button onClick={() => setOpen(v => !v)} style={{ padding: "7px 14px", background: "transparent", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {open ? "Annuler" : "Modifier"}
                </button>
            </div>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", marginTop: 16 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 400 }}>
                            {[
                                { label: "Mot de passe actuel", val: current, set: setCurrent },
                                { label: "Nouveau mot de passe", val: next, set: setNext },
                                { label: "Confirmer le nouveau", val: confirm, set: setConfirm },
                            ].map(({ label, val, set }) => (
                                <div key={label}>
                                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>{label}</div>
                                    <input type="password" value={val} onChange={e => set(e.target.value)}
                                           style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 9, fontSize: 14, color: "#0f172a", background: "#f8fafc", outline: "none", fontFamily: "inherit" }} />
                                </div>
                            ))}
                            {msg && <div style={{ fontSize: 12, color: msg.ok ? "#16a34a" : "#ef4444", padding: "8px 12px", background: msg.ok ? "#f0fdf4" : "#fef2f2", borderRadius: 8 }}>{msg.text}</div>}
                            <button onClick={save} disabled={loading} style={{ padding: "10px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                {loading ? "Enregistrement…" : "Changer le mot de passe"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Auth() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nom, setNom] = useState("");
    const [userId, setUserIdState] = useState<number | null>(getUserId());
    const [me, setMe] = useState<Me | null>(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [msgOk, setMsgOk] = useState(false);

    const isLogged = useMemo(() => userId !== null, [userId]);
    const payload = getJwtPayload();

    useEffect(() => {
        if (!userId) { setMe(null); return; }
        apiMe(userId).then(d => setMe(d as Me)).catch(() => setMe(null));
    }, [userId]);

    const showMsg = (text: string, ok = false) => { setMsg(text); setMsgOk(ok); setTimeout(() => setMsg(null), 4000); };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setMsg(null); setLoading(true);
        try {
            if (mode === "login") {
                const r = await apiLogin(email, password);
                setUserId(r.userId); setUserIdState(r.userId);
                navigate("/");
            } else {
                await apiRegister(email, password, nom);
                showMsg("Compte créé ! Connectez-vous maintenant.", true);
                setMode("login");
                setEmail(email); setPassword(""); setNom("");
            }
        } catch (e: unknown) { showMsg((e as Error)?.message ?? "Erreur"); }
        finally { setLoading(false); }
    };

    const logout = () => { apiLogout(); clearUserId(); setUserIdState(null); setMe(null); navigate("/"); };
    const reloadMe = () => { if (userId) apiMe(userId).then(d => setMe(d as Me)).catch(() => {}); };

    const updateName = async (fullName: string) => {
        if (!userId) return;
        const [firstName, ...rest] = fullName.trim().split(" ");
        const lastName = rest.join(" ") || ".";
        await apiUpdateProfile(userId, { firstName, lastName });
        showMsg("Nom mis à jour !", true); reloadMe();
    };

    const updateEmail = async (newEmail: string) => {
        if (!userId) return;
        await apiUpdateProfile(userId, { email: newEmail });
        showMsg("Email mis à jour !", true); reloadMe();
    };

    // ── Page de connexion / inscription ───────────────────────────────────────
    if (!isLogged) {
        return (
            <div className="authPage">
                <div className="authBg" />

                <motion.div
                    className="authCard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Header sombre */}
                    <div className="authTop">
                        <div>
                            <div className="authBadge">🎾 AceArena</div>
                            <h1 className="authTitle">{mode === "login" ? "Connexion" : "Inscription"}</h1>
                            <p className="authSub">Connecte-toi pour réserver des terrains et rejoindre des matchs.</p>
                        </div>
                    </div>

                    {/* Message succès / erreur */}
                    <AnimatePresence>
                        {msg && (
                            <motion.div
                                className={`authMsg ${msgOk ? "" : "authMsgErr"}`}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                {msg}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Tabs */}
                    <div className="authTabs">
                        {(["login", "register"] as const).map(m => (
                            <button
                                key={m}
                                className={`authTab ${mode === m ? "active" : ""}`}
                                onClick={() => setMode(m)}
                                type="button"
                            >
                                {m === "login" ? "Connexion" : "Inscription"}
                            </button>
                        ))}
                    </div>

                    {/* Formulaire */}
                    <form className="authForm" onSubmit={onSubmit}>
                        <AnimatePresence>
                            {mode === "register" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{ overflow: "hidden" }}
                                >
                                    <label className="authLabel">
                                        Nom complet
                                        <input
                                            className="authInput"
                                            value={nom}
                                            onChange={e => setNom(e.target.value)}
                                            placeholder="Ex: Salma Ben Ali"
                                            required
                                        />
                                    </label>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <label className="authLabel">
                            Email
                            <input
                                className="authInput"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="vous@email.com"
                                required
                            />
                        </label>

                        <label className="authLabel">
                            Mot de passe
                            <input
                                className="authInput"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </label>

                        <button className="authPrimaryBtn" type="submit" disabled={loading}>
                            {loading ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    // ── Mon Compte ─────────────────────────────────────────────────────────────
    const firstName = payload?.firstName ?? me?.nom?.split(" ")[0] ?? "?";
    const lastName  = payload?.lastName  ?? me?.nom?.split(" ").slice(1).join(" ") ?? "";
    const fullName  = `${firstName} ${lastName}`.trim();
    const isAdmin   = me?.role?.includes("ADMIN") ?? false;

    return (
        <div style={{ minHeight: "100vh", background: "#f8f7f4", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');`}</style>

            <AnimatePresence>
                {msg && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                style={{ position: "fixed", top: 72, left: "50%", transform: "translateX(-50%)", zIndex: 200,
                                    padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
                                    background: msgOk ? "#f0fdf4" : "#fef2f2", color: msgOk ? "#15803d" : "#dc2626",
                                    border: `1px solid ${msgOk ? "#bbf7d0" : "#fecaca"}`,
                                    boxShadow: "0 4px 16px rgba(15,23,42,0.12)" }}>
                        {msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <main style={{ maxWidth: 680, margin: "0 auto", padding: "48px 20px 80px" }}>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #0f172a, #334155)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                            {firstName[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#0f172a" }}>{fullName}</h1>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                                <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                                    background: isAdmin ? "rgba(124,58,237,0.1)" : "rgba(22,163,74,0.1)",
                                    color: isAdmin ? "#7c3aed" : "#16a34a",
                                    border: `1px solid ${isAdmin ? "rgba(124,58,237,0.25)" : "rgba(22,163,74,0.25)"}` }}>
                                    {isAdmin ? "Administrateur" : "Joueur"}
                                </span>
                                <span style={{ fontSize: 13, color: "#64748b" }}>{me?.email}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                            style={{ background: "#fff", borderRadius: 18, padding: "28px 28px", marginBottom: 16, boxShadow: "0 1px 4px rgba(15,23,42,0.06)", border: "1px solid rgba(15,23,42,0.06)" }}>
                    <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                        <span>👤</span> Informations personnelles
                    </h2>
                    <EditField label="Nom complet" value={fullName} onSave={updateName} placeholder="Prénom Nom" />
                    <EditField label="Adresse email" value={me?.email ?? ""} onSave={updateEmail} type="email" placeholder="vous@email.com" />
                    {userId && <PasswordSection userId={userId} />}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                    {[
                        { icon: "📅", label: "Réservations", to: "/booking" },
                        { icon: "🎾", label: "Matchs", to: "/match" },
                        { icon: "📦", label: "Locations", to: "/rentals" },
                    ].map(({ icon, label, to }) => (
                        <button key={to} onClick={() => navigate(to)}
                                style={{ padding: "16px 12px", background: "#fff", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 14, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontFamily: "inherit", transition: "all .15s", boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#0f172a"; (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(15,23,42,0.08)"; (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}>
                            <span style={{ fontSize: 22 }}>{icon}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{label}</span>
                        </button>
                    ))}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <button onClick={logout}
                            style={{ width: "100%", padding: "13px", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#dc2626", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.06)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                        Se déconnecter
                    </button>
                </motion.div>
            </main>
        </div>
    );
}