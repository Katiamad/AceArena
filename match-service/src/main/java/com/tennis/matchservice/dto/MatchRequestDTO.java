package com.tennis.matchservice.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class MatchRequestDTO {
    private Long bookingId;         // ID de la réservation générée par le service .NET
    private Long userId;            // ID de l'utilisateur qui crée le match
    private String matchType;       // "1VS1" ou "2VS2"
    private Double totalCourtPrice; // Le prix plein du terrain (ex: 40.0)
    private String courtName;       // Nom du terrain
    private String slotStartTime;   // Début du créneau (ISO string)
    private String slotEndTime;     // Fin du créneau (ISO string)
}