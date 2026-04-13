package com.tennis.equipmentservice.dto;

import com.tennis.equipmentservice.entity.EquipmentCategory;
import com.tennis.equipmentservice.entity.EquipmentStatus;
import jakarta.validation.constraints.Min;

public record EquipmentUpdateRequest(
        Long clubId,
        String name,
        EquipmentCategory category,
        @Min(0) Integer stockTotal,
        @Min(0) Integer stockAvailable,
        EquipmentStatus status,
        Long version  //  OBLIGATOIRE
) {}
