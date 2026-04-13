package com.tennis.equipmentservice.dto;

import com.tennis.equipmentservice.entity.EquipmentCategory;
import com.tennis.equipmentservice.entity.EquipmentStatus;

import java.time.Instant;

public record EquipmentResponse(
        Long id,
        Long clubId,
        String name,
        EquipmentCategory category,
        Integer stockTotal,
        Integer stockAvailable,
        EquipmentStatus status,
        Instant createdAt,
        Instant updatedAt,
        Long version,
        Long createdByUserId,
        String createdByFirstName,
        String createdByLastName,
        Long updatedByUserId,
        String updatedByFirstName,
        String updatedByLastName
) {}