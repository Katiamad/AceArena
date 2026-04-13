package com.tennis.paymentservice.events;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Publié vers booking-service après traitement du paiement.
 * Exchange : payment.exchange | Routing key : payment.booking.status
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingPaymentStatusEvent {
    private Long bookingId;
    private String userId;

    @JsonProperty("isPaid")
    private boolean isPaid;

    private String failureReason;
    private BigDecimal amountPaid;
    private LocalDateTime processedAt;
}
