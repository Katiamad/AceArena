package com.tennis.paymentservice.messaging.events;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Reçu depuis booking-service.
 * Exchange : booking.exchange  |  Routing key : booking.payment.request
 * Mode SIMPLE — déclenche un paiement direct.
 */
@Data @Builder @AllArgsConstructor @NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class BookingPaymentRequestEvent {
    private Long          bookingId;
    private String        userId;
    private Long          courtId;
    private String        courtName;
    private LocalDateTime slotStartTime;
    private LocalDateTime slotEndTime;
    private int           durationHours;
    private BigDecimal    totalPrice;
    private LocalDateTime createdAt;
}