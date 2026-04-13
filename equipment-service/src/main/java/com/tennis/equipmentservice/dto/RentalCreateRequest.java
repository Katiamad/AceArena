package com.tennis.equipmentservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record RentalCreateRequest(
        @NotNull Long bookingId,
        Long clubId,
        @Valid @NotNull List<RentalItemRequest> items
) {}
