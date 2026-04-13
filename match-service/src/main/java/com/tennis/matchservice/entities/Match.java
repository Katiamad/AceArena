package com.tennis.matchservice.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long bookingId; // Lien vers booking-service .NET

    @Column(nullable = false)
    private String matchType; // "1VS1" ou "2VS2"

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<MatchParticipant> participants;

    @Column(nullable = false)
    private Long ownerUserId;

    @Column
    private String ownerFirstName;

    @Column
    private String ownerLastName;

    private int maxPlayers; // 2 ou 4

    /** Infos terrain et créneau — passées depuis le frontend */
    @Column
    private String courtName;

    @Column
    private String slotStartTime;

    @Column
    private String slotEndTime;

    /** Prix total du terrain — reçu via BookingMatchDelegateEvent */
    @Column
    private Double totalCourtPrice;

    /** Prix par joueur = totalCourtPrice / maxPlayers — calculé au @PrePersist */
    @Column
    private Double pricePerPlayer;

    @Enumerated(EnumType.STRING)
    private MatchStatus status; // OPEN, FULL, COMPLETED, CANCELLED

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = MatchStatus.OPEN;
        this.maxPlayers = "1VS1".equalsIgnoreCase(matchType) ? 2 : 4;

        // Calculer pricePerPlayer automatiquement si totalCourtPrice est fourni
        if (totalCourtPrice != null && maxPlayers > 0) {
            this.pricePerPlayer = totalCourtPrice / maxPlayers;
        }
    }
}