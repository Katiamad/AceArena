package com.tennis.notificationservice.evenements;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingEvent {
    private Long bookingId;
    private Long userId;
    private String courtName;
    private String status;  // "CONFIRMED", "CANCELLED"
    private String message;
}
