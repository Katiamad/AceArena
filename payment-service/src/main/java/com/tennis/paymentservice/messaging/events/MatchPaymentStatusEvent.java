package com.tennis.paymentservice.messaging.events;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Publié vers match-service.
 * Exchange : payment.exchange  |  Routing key : payment.match.status
 * Mode MATCH — résultat du paiement groupé.
 *   isPaid=true  → match-service publie MatchBookingPaidEvent → booking MATCH_WAITING_PLAYERS
 *   isPaid=false → match-service publie MatchBookingPaidEvent(isPaid=false) → booking CANCELLED
 */
@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class MatchPaymentStatusEvent {
    private Long          matchId;
    private Long          bookingId;
    private String        userId;
    private boolean       isPaid;
    private String        failureReason;
    private BigDecimal    amountPaid;
    private LocalDateTime processedAt;
}
