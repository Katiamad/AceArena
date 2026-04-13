package com.tennis.notificationservice.evenements;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchEvent {
    private Long matchId;
    private Long userId;
    private String type;
    private LocalDateTime timestamp;

    // Enrichissement pour notifications détaillées
    private String playerFirstName;
    private String playerLastName;
    private String courtName;
    private String slotInfo;
}
