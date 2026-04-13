package com.tennis.authservice.modele;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // si tu veux garder code (FREE/PREMIUM/CLUB) c’est ok même si ton résumé ne l’a pas,
    // ça aide beaucoup pour retrouver un plan.
    @Column(unique = true, nullable = false)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "max_bookings_per_week", nullable = false)
    private int maxBookingsPerWeek;

    @Column(name = "allow_double_matches", nullable = false)
    private boolean allowDoubleMatches;

    @Column(name = "duration_days", nullable = false)
    private int durationDays;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    public static Subscription planFree() {
        return Subscription.builder()
                .code("FREE")
                .name("Gratuit")
                .maxBookingsPerWeek(1)
                .allowDoubleMatches(false)
                .durationDays(30)
                .price(BigDecimal.ZERO)
                .createdAt(OffsetDateTime.now())
                .build();
    }
}