package com.tennis.matchservice.dto;

import com.tennis.matchservice.entities.MatchStatus;
import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class MatchResponseDTO {
    private Long matchId;
    private String matchType;
    private Double pricePerPlayer;
    private int currentPlayers;
    private int maxPlayers;
    private MatchStatus status;
}