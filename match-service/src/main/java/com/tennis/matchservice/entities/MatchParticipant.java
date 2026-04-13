package com.tennis.matchservice.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Data
@Entity
@Table(name = "match_participants")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MatchParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column
    private String userFirstName;

    @Column
    private String userLastName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference
    @JoinColumn(name = "match_id")
    private Match match;

    private LocalDateTime joinedAt = LocalDateTime.now();

    /** true une fois que CE joueur a payé sa part (pricePerPlayer) */
    @Column(nullable = false)
    @Builder.Default
    private boolean hasPaid = false;

    @Builder.Default
    private String status = "PENDING";

    /** Timestamp du paiement du joueur */
    @Column
    private LocalDateTime paidAt;
}