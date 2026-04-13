package com.tennis.matchservice.evenements;



import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Event publié par match-service vers booking-service
 * une fois que le match est créé ET payé.
 *
 * Routing key : match.booking.paid
 * Exchange    : match.exchange
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MatchBookingPaidEvent {

    private Long bookingId;
    private Long matchId;
    private String userId;

    @JsonProperty("isPaid")
    private boolean isPaid;

    private BigDecimal amountPaid;
    private LocalDateTime processedAt;
}
