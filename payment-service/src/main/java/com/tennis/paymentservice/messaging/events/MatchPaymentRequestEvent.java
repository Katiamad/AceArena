package com.tennis.paymentservice.messaging.events;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Reçu depuis match-service.
 * Exchange : match.exchange  |  Routing key : match.payment.request
 * Mode MATCH — déclenche un paiement groupé quand le match est FULL.
 */
@Data @Builder @AllArgsConstructor @NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MatchPaymentRequestEvent {
    private Long          matchId;
    private Long          bookingId;
    private String        userId;
    private String        courtName;
    private int           nbPlayers;
    private BigDecimal    totalPrice;
    private BigDecimal    pricePerPlayer;
    private LocalDateTime createdAt;
}
