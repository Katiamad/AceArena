package com.tennis.matchservice.evenements;



import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;


/**
 * Event reçu depuis booking-service.
 * Envoyé quand un utilisateur choisit le mode MATCH lors de sa réservation.
 *
 * Routing key : booking.match.delegate
 * Exchange    : booking.exchange
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class BookingMatchDelegateEvent {

    /** ID de la réservation créée côté booking-service */
    private Long bookingId;

    /** ID de l'utilisateur qui a initié la réservation */
    private Long userId;

    /** Terrain réservé */
    private Long courtId;
    private String courtName;

    /** Créneau */
    private Long timeSlotId;
    private LocalDateTime slotStartTime;
    private LocalDateTime slotEndTime;

    /** Durée choisie */
    private int durationHours;

    /** Montant total à payer */
    private BigDecimal totalPrice;

    private LocalDateTime createdAt;
}
