package com.tennis.authservice.controleur.dtos;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MeDTO {
    private Long id;
    private String email;
    private String nom;
    private String role;
    private String subscriptionCode;
    private String subscriptionName;
    private Integer weeklyQuota;
    private Boolean allow2v2;
    private String subscriptionValidUntil;
}