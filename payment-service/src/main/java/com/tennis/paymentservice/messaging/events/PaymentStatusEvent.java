package com.tennis.paymentservice.messaging.events;



import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Publié vers booking-service.
 * Exchange : payment.exchange  |  Routing key : payment.booking.status
 * Mode SIMPLE — résultat du paiement direct.
 *   isPaid=true  → booking CONFIRMED
 *   isPaid=false → booking CANCELLED
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentStatusEvent {
    private Long          bookingId;
    private String        userId;
    private boolean       isPaid;
    private String        failureReason;
    private BigDecimal    amountPaid;
    private LocalDateTime processedAt;
}
