package com.tennis.matchservice.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "match_requests")
public class MatchRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long matchId;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED

    private LocalDateTime createdAt = LocalDateTime.now();
}
