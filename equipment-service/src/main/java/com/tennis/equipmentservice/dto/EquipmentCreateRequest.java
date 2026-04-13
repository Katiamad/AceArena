package com.tennis.equipmentservice.dto;

import com.tennis.equipmentservice.entity.EquipmentCategory;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EquipmentCreateRequest(
        Long clubId,
        @NotBlank String name,
        @NotNull EquipmentCategory category,
        @NotNull @Min(0) Integer stockTotal,
        @NotNull @Min(0) Integer stockAvailable
) {}
