package com.tennis.equipmentservice.dto;

public record RentalItemResponse(
        Long equipmentId,
        String equipmentName,
        Integer quantity
) {}
