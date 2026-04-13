package com.tennis.notificationservice.entity;

public enum NotificationType {
    // Match
    PLAYER_JOINED_MATCH,
    MATCH_COMPLETED,
    MATCH_CANCELLED,
    MATCH_CREATED,
    MATCH_FULL,
    MATCH_WAITING_PLAYERS,
    MATCH_PAYMENT_PAID,
    MATCH_PAYMENT_FAILED,

    // Booking
    BOOKING_CONFIRMED,
    BOOKING_CANCELLED,

    // Equipment
    EQUIPMENT_RENTED,
    EQUIPMENT_PAID,
    STOCK_UPDATED,
    EQUIPMENT_RETURN_REMINDER,
    LOW_STOCK_ALERT,
    EQUIPMENT_RESTOCKED
}
