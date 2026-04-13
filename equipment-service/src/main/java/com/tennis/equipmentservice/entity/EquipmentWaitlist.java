package com.tennis.equipmentservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipment_waitlist")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentWaitlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long equipmentId;
    private Long userId;
    private LocalDateTime createdAt;
}