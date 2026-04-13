import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPayment, processPayment } from '../api/client.ts';
import type { Payment } from '../types/payment.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationState {
    bookingId?: number;
    rentalId?: number;
    matchId?: number;
    courtName?: string;
    amount: number;
    slotStartTime?: string;
    matchType?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getUserIdFromToken = (): number => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return 0;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return Number(payload.sub) || 0;
    } catch {
        return 0;
    }
};

const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', {
        weekday: 'short', day: 'numeric', month: 'long',
        hour: '2-digit', minute: '2-digit',
    });

// ─── Composant ────────────────────────────────────────────────────────────────

export default function PaymentPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as LocationState | null;

    const [payment, setPayment] = useState<Payment | null>(null);
    const [cardNumber, setCardNumber] = useState('');
    const [cvv, setCvv] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Détermine le type de paiement
    const isEquipment = !!state?.rentalId && !state?.bookingId;
    const isMatch = !!state?.matchId;
    const isBooking = !!state?.bookingId && !state?.matchId;

    // ── Pas de state valide → redirection ─────────────────────────────────────
    if (!state || (!state.bookingId && !state.rentalId && !state.matchId)) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: '#f8fafc' }}>
                <div style={{ fontSize: 48 }}>⚠️</div>
                <p style={{ color: '#64748b', fontSize: 15 }}>Aucun paiement en attente.</p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={() => navigate('/booking')}
                        style={{ padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                        Mes réservations
                    </button>
                    <button
                        onClick={() => navigate('/rentals')}
                        style={{ padding: '10px 20px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                        Mes locations
                    </button>
                </div>
            </div>
        );
    }

    // ── Label et titre selon le contexte ──────────────────────────────────────
    const pageTitle = isEquipment ? 'Paiement location' : isMatch ? 'Paiement match' : 'Paiement réservation';
    const pageSubtitle = isEquipment
        ? 'Réglez votre location d\'équipement en toute sécurité'
        : isMatch
            ? 'Réglez votre participation au match'
            : 'Réglez votre réservation de terrain en toute sécurité';
    const refLabel = isEquipment
        ? `Location #${state.rentalId}`
        : isMatch
            ? `Match #${state.matchId}`
            : `Réservation #${state.bookingId}`;

    // ── Redirection après paiement réussi ─────────────────────────────────────
    const redirectAfterPayment = () => {
        if (isEquipment) navigate('/rentals');
        else if (isMatch) navigate('/match');
        else navigate('/booking');
    };

    // ── Initialiser le paiement ───────────────────────────────────────────────
    const handleCreatePayment = async () => {
        setError(null);
        setLoading(true);
        try {
            const paymentData: Payment = {
                userId: getUserIdFromToken(),
                amount: state.amount,
                currency: 'EUR',
                paymentMethod: 'CARD',
            };

            // Remplir selon le type
            if (state.bookingId) paymentData.bookingId = state.bookingId;
            if (state.matchId) paymentData.matchId = state.matchId;
            if (state.rentalId) paymentData.rentalId = state.rentalId;

            // Type de paiement
            if (isMatch) paymentData.paymentType = 'MATCH';
            else if (isBooking) paymentData.paymentType = 'BOOKING';
            else if (isEquipment) paymentData.paymentType = 'EQUIPMENT';

            const created = await createPayment(paymentData);
            setPayment(created);
        } catch {
            setError('Erreur lors de l\'initialisation du paiement.');
        } finally {
            setLoading(false);
        }
    };

    // ── Valider le paiement ───────────────────────────────────────────────────
    const handleProcessPayment = async () => {
        if (!payment?.id) return;
        if (!/^\d{16}$/.test(cardNumber)) { setError('Le numéro de carte doit contenir exactement 16 chiffres'); return; }
        if (!/^\d{3}$/.test(cvv)) { setError('Le CVV doit contenir exactement 3 chiffres'); return; }
        const today = new Date().toISOString().split('T')[0];
        if (!expirationDate || expirationDate <= today) { setError('La carte est expirée'); return; }

        setError(null);
        setLoading(true);
        try {
            const processed = await processPayment(payment.id, cardNumber, cvv, expirationDate);
            setPayment(processed);
            if (processed.status === 'PAID') {
                setTimeout(() => redirectAfterPayment(), 2500);
            }
        } catch {
            setError('Erreur lors du traitement du paiement.');
        } finally {
            setLoading(false);
        }
    };

    const statusColor = payment?.status === 'PAID' ? '#15803d' : payment?.status === 'FAILED' ? '#dc2626' : '#b45309';
    const statusBg    = payment?.status === 'PAID' ? '#f0fdf4' : payment?.status === 'FAILED' ? '#fef2f2' : '#fffbeb';

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
                * { box-sizing: border-box; }
                .pay-input { width: 100%; padding: 11px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 14px; color: #111; background: #fafafa; outline: none; transition: border-color 0.2s, box-shadow 0.2s; font-family: inherit; }
                .pay-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
                .pay-btn { width: 100%; padding: 13px; border: none; border-radius: 11px; font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.18s ease; font-family: inherit; }
                .pay-btn:hover:not(:disabled) { filter: brightness(1.07); transform: translateY(-1px); }
                .pay-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            `}</style>

            <div style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 440, boxShadow: '0 16px 60px rgba(0,0,0,0.1)', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', padding: '28px 32px' }}>
                    <div style={{ fontSize: 10, color: 'rgba(74,222,128,0.8)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>🔒 AceArena</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#fff' }}>{pageTitle}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>{pageSubtitle}</div>
                </div>

                <div style={{ padding: '28px 32px 32px' }}>

                    {/* ── Récap ── */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 14, padding: '14px 18px', marginBottom: 22 }}>
                        {state.courtName && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 12, color: '#6b7280' }}>Terrain</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{state.courtName}</span>
                            </div>
                        )}
                        {state.slotStartTime && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 12, color: '#6b7280' }}>Créneau</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{formatDate(state.slotStartTime)}</span>
                            </div>
                        )}
                        {state.matchType && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 12, color: '#6b7280' }}>Mode</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{state.matchType}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>Montant total</span>
                            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#111' }}>{state.amount.toFixed(2)} €</span>
                        </div>
                    </div>

                    {/* ── Pas encore initialisé ── */}
                    {!payment && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
                            <div style={{ color: '#374151', fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Prêt à payer ?</div>
                            <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 24 }}>
                                {refLabel}
                            </div>

                            {error && (
                                <div style={{ marginBottom: 14, padding: '10px 13px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, color: '#dc2626', fontSize: 13, textAlign: 'left' }}>
                                    ⚠️ {error}
                                </div>
                            )}

                            <button
                                className="pay-btn"
                                onClick={handleCreatePayment}
                                disabled={loading}
                                style={{ background: 'linear-gradient(135deg,#16a34a,#4ade80)', color: '#fff', boxShadow: '0 4px 16px rgba(22,163,74,0.25)' }}
                            >
                                {loading ? 'Initialisation...' : 'Initialiser le paiement'}
                            </button>
                        </div>
                    )}

                    {/* ── Paiement initialisé ── */}
                    {payment && (
                        <>
                            {/* Statut */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <span style={{ fontSize: 13, color: '#6b7280' }}>Statut paiement</span>
                                <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: statusColor, background: statusBg, border: `1px solid ${statusColor}33`, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                    {payment.status}
                                </span>
                            </div>

                            {/* Succès */}
                            {payment.status === 'PAID' && (
                                <div style={{ padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, color: '#15803d', fontSize: 14, fontWeight: 600, textAlign: 'center', marginBottom: 16 }}>
                                    ✅ Paiement validé ! Redirection en cours…
                                </div>
                            )}

                            {/* Formulaire carte */}
                            {payment.status !== 'PAID' && (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Numéro de carte (16 chiffres)</label>
                                            <input className="pay-input" type="text" maxLength={16} value={cardNumber}
                                                   onChange={e => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>CVV</label>
                                                <input className="pay-input" type="text" maxLength={3} value={cvv}
                                                       onChange={e => setCvv(e.target.value)} placeholder="123" />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Expiration</label>
                                                <input className="pay-input" type="date" value={expirationDate}
                                                       onChange={e => setExpirationDate(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div style={{ marginTop: 14, padding: '10px 13px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, color: '#dc2626', fontSize: 13 }}>
                                            ⚠️ {error}
                                        </div>
                                    )}

                                    <button
                                        className="pay-btn"
                                        onClick={handleProcessPayment}
                                        disabled={loading}
                                        style={{ marginTop: 20, background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: '#fff', boxShadow: '0 4px 16px rgba(37,99,235,0.25)' }}
                                    >
                                        {loading ? '⏳ Traitement...' : '🔒 Valider le paiement'}
                                    </button>
                                </>
                            )}

                            <div style={{ textAlign: 'center', marginTop: 12, color: '#9ca3af', fontSize: 11 }}>
                                Paiement chiffré SSL — Données sécurisées
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
