package com.tennis.paymentservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data // Génère TOUS les Getters et Setters automatiquement
@Builder // Permet d'utiliser Payment.builder()...
@NoArgsConstructor // Constructeur vide pour JPA
@AllArgsConstructor // Constructeur complet pour Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_first_name")
    private String userFirstName;

    @Column(name = "user_last_name")
    private String userLastName;

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "match_id")
    private Long matchId;

    @Column(name = "rental_id")
    private Long rentalId;

    @Column(name = "payment_type")
    private String paymentType; // BOOKING, MATCH, EQUIPMENT

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}