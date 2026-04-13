package com.tennis.matchservice.evenements;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Publié vers payment-service quand le match est FULL.
 * Exchange : payment.exchange  |  Routing key : match.payment.request
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
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