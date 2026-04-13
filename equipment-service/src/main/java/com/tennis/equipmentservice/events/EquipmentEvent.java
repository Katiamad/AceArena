package com.tennis.equipmentservice.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentEvent {
    private String userId;      // 👈 String au lieu de UUID
    private String title;
    private String message;
    private String type;
    private String equipmentName;
    private String returnDate;
}