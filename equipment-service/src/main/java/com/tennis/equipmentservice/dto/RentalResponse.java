package com.tennis.equipmentservice.dto;

import com.tennis.equipmentservice.entity.RentalStatus;

import java.time.Instant;
import java.util.List;

public record RentalResponse(
        Long id,
        Long bookingId,
        Long userId,
        Long clubId,
        RentalStatus status,
        List<RentalItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {}
