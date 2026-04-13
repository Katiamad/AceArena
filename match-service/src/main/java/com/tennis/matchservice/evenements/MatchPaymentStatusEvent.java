package com.tennis.matchservice.evenements;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Reçu depuis payment-service après paiement de la part d'UN joueur.
 * Exchange : payment.exchange  |  Routing key : payment.match.status
 */
@Data @AllArgsConstructor @NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MatchPaymentStatusEvent {
    private Long          matchId;
    private Long          bookingId;
    private String        userId;       // joueur qui vient de payer

    @JsonProperty("isPaid")
    private boolean       isPaid;

    private String        failureReason;
    private BigDecimal    amountPaid;   // = pricePerPlayer
    private LocalDateTime processedAt;
}