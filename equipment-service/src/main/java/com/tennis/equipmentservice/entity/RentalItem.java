package com.tennis.equipmentservice.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "rental_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relation vers Rental
    @ManyToOne(optional = false)
    @JoinColumn(name = "rental_id")
    private Rental rental;

    // Relation vers Equipment
    @ManyToOne(optional = false)
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;

    @Column(nullable = false)
    private Integer quantity;
}
