export interface MatchRequestDTO {
    bookingId: string;
    userId: string;
    matchType: "1vs1" | "2vs2";
    totalCourtPrice: number;
}

export interface MatchResponseDTO {
    matchId: string;
    matchType: string;
    pricePerPlayer: number;
    currentPlayers: number;
    maxPlayers: number;
    status: "OPEN" | "FULL" | "CANCELLED";
}

export interface MatchParticipantDTO {
    id: string;
    userId: string;
    joinedAt: string;
}

export interface MatchDetailsDTO {
    matchId: string;
    matchType: string;
    pricePerPlayer: number;
    currentPlayers: number;
    maxPlayers: number;
    status: string;
    participants: MatchParticipantDTO[];
}
