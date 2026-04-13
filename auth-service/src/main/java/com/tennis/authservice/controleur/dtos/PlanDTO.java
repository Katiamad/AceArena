package com.tennis.authservice.controleur.dtos;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlanDTO {
    private String code;
    private String name;
    private Integer weeklyQuota;
    private Boolean allow2v2;
    private Integer durationDays;
}