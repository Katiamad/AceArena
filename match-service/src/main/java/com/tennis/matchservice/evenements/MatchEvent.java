package com.tennis.matchservice.evenements;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MatchEvent {
    private Long matchId;
    private Long userId;
    private String type; // "CREATED", "JOINED", "LEFT", "FULL", "PAID", "COMPLETED", "WAITING_PLAYERS", "PAYMENT_FAILED", "CANCELLED"
    private LocalDateTime timestamp;

    // Enrichissement pour notifications détaillées
    private String playerFirstName;
    private String playerLastName;
    private String courtName;
    private String slotInfo;

    /** Constructeur simplifié (rétro-compatible) */
    public MatchEvent(Long matchId, Long userId, String type, LocalDateTime timestamp) {
        this.matchId = matchId;
        this.userId = userId;
        this.type = type;
        this.timestamp = timestamp;
    }
}
