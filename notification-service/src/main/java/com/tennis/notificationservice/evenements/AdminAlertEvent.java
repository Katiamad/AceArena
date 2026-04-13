package com.tennis.notificationservice.evenements;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminAlertEvent {
    private String title;
    private String message;
    private String type;
    private String equipmentName;
}