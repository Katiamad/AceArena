import { createContext, useContext, useState, type ReactNode } from "react";

/* =========================
   TYPES
   ========================= */

export interface Match {
    id: number;
    player1: string;
    player2: string;
    score1: number;
    score2: number;
    status: "PENDING" | "IN_PROGRESS" | "FINISHED" | "CANCELED";
    courtId?: number;
    date?: string;
}

interface MatchContextType {
    matches: Match[];
    currentMatch: Match | null;
    setMatches: (matches: Match[]) => void;
    setCurrentMatch: (match: Match | null) => void;
    addMatch: (match: Match) => void;
    updateMatch: (id: number, updates: Partial<Match>) => void;
    removeMatch: (id: number) => void;
}

/* =========================
   CONTEXT
   ========================= */

const MatchContext = createContext<MatchContextType | null>(null);

/* =========================
   PROVIDER
   ========================= */

export function MatchProvider({ children }: { children: ReactNode }) {
    const [matches, setMatches] = useState<Match[]>([]);
    const [currentMatch, setCurrentMatch] = useState<Match | null>(null);

    const addMatch = (match: Match) => {
        setMatches((prev) => [...prev, match]);
    };

    const updateMatch = (id: number, updates: Partial<Match>) => {
        setMatches((prev) =>
            prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
        );
    };

    const removeMatch = (id: number) => {
        setMatches((prev) => prev.filter((m) => m.id !== id));
    };

    return (
        <MatchContext.Provider
            value={{
                matches,
                currentMatch,
                setMatches,
                setCurrentMatch,
                addMatch,
                updateMatch,
                removeMatch,
            }}
        >
            {children}
        </MatchContext.Provider>
    );
}

/* =========================
   HOOK
   ========================= */

export function useMatchContext(): MatchContextType {
    const ctx = useContext(MatchContext);
    if (!ctx) throw new Error("useMatchContext must be used inside <MatchProvider>");
    return ctx;
}