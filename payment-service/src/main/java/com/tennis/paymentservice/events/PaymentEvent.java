package com.tennis.paymentservice.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentEvent {
    private Long rentalId;
    private Long userId;
    private Double amount;
    private String status; // "PAID" ou "FAILED"
}