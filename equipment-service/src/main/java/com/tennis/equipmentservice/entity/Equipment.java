package com.tennis.equipmentservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "equipments",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"clubId", "name"})
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long clubId;

    // Qui a créé l'équipement
    @Column
    private Long createdByUserId;

    @Column
    private String createdByFirstName;

    @Column
    private String createdByLastName;

    // Qui a fait la dernière modification
    @Column
    private Long updatedByUserId;

    @Column
    private String updatedByFirstName;

    @Column
    private String updatedByLastName;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EquipmentCategory category;

    @Column(nullable = false)
    private Integer stockTotal;

    @Column(nullable = false)
    private Integer stockAvailable;

    @Column(nullable = false)
    private Integer lowStockThreshold = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EquipmentStatus status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Version
    private Long version;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) status = EquipmentStatus.ACTIVE;
        if (lowStockThreshold == null) lowStockThreshold = 0;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}