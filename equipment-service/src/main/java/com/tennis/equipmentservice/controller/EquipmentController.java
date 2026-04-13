package com.tennis.equipmentservice.controller;

import com.tennis.equipmentservice.dto.*;
import com.tennis.equipmentservice.service.EquipmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipments")
public class EquipmentController {

    private final EquipmentService equipmentService;


    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    @PostMapping
    public ResponseEntity<EquipmentResponse> create(
            @RequestBody @Valid EquipmentCreateRequest req,
            JwtAuthenticationToken authentication
    ) {
        Long userId = Long.parseLong(authentication.getName());
        String firstName = (String) authentication.getTokenAttributes().get("firstName");
        String lastName = (String) authentication.getTokenAttributes().get("lastName");
        return ResponseEntity.ok(equipmentService.create(req, userId, firstName, lastName));
    }

    @GetMapping
    public ResponseEntity<List<EquipmentResponse>> all(JwtAuthenticationToken authentication) {
        return ResponseEntity.ok(equipmentService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipmentResponse> one(
            @PathVariable Long id,
            JwtAuthenticationToken authentication
    ) {
        return ResponseEntity.ok(equipmentService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipmentResponse> update(
            @PathVariable Long id,
            @RequestBody @Valid EquipmentUpdateRequest req,
            JwtAuthenticationToken authentication
    ) {
        Long userId = Long.parseLong(authentication.getName());
        String firstName = (String) authentication.getTokenAttributes().get("firstName");
        String lastName = (String) authentication.getTokenAttributes().get("lastName");
        return ResponseEntity.ok(equipmentService.update(id, req, userId, firstName, lastName));
    }

    @GetMapping("/club/{clubId}")
    public ResponseEntity<List<EquipmentResponse>> findByClub(
            @PathVariable Long clubId,
            JwtAuthenticationToken authentication
    ) {
        return ResponseEntity.ok(equipmentService.findByClub(clubId));
    }

    @GetMapping("/club/{clubId}/available")
    public ResponseEntity<List<EquipmentResponse>> findAvailableByClub(
            @PathVariable Long clubId,
            JwtAuthenticationToken authentication
    ) {
        return ResponseEntity.ok(equipmentService.findAvailableByClub(clubId));
    }

    @PostMapping("/{id}/notify-me")
    public ResponseEntity<Void> notifyMe(
            @PathVariable Long id,
            JwtAuthenticationToken authentication) {
        Long userId = Long.parseLong(authentication.getName());
        equipmentService.notifyMe(id, userId);
        return ResponseEntity.ok().build();
    }
}