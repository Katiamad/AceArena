package com.tennis.equipmentservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RentalItemRequest(
        @NotNull Long equipmentId,
        @NotNull @Min(1) Integer quantity
) {}
