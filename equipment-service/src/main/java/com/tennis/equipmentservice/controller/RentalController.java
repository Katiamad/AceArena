package com.tennis.equipmentservice.controller;

import com.tennis.equipmentservice.dto.RentalCreateRequest;
import com.tennis.equipmentservice.dto.RentalResponse;
import com.tennis.equipmentservice.service.RentalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rentals")
public class RentalController {

    private final RentalService rentalService;

    public RentalController(RentalService rentalService) {
        this.rentalService = rentalService;
    }

    @PostMapping
    public ResponseEntity<RentalResponse> create(
            @RequestBody @Valid RentalCreateRequest req,
            JwtAuthenticationToken authentication
    ) {
        Long userId = Long.parseLong(authentication.getName());
        String firstName = (String) authentication.getTokenAttributes().get("firstName");
        String lastName = (String) authentication.getTokenAttributes().get("lastName");
        return ResponseEntity.ok(rentalService.createRental(req, userId, firstName, lastName));
    }

    @GetMapping
    public ResponseEntity<List<RentalResponse>> all(JwtAuthenticationToken authentication) {
        return ResponseEntity.ok(rentalService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RentalResponse> one(
            @PathVariable Long id,
            JwtAuthenticationToken authentication
    ) {
        return ResponseEntity.ok(rentalService.findById(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<RentalResponse> cancel(
            @PathVariable Long id,
            JwtAuthenticationToken authentication
    ) {
        Long userId = Long.parseLong(authentication.getName());
        return ResponseEntity.ok(rentalService.cancel(id, userId));
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<RentalResponse> returnRental(
            @PathVariable Long id,
            JwtAuthenticationToken authentication
    ) {
        Long userId = Long.parseLong(authentication.getName());
        return ResponseEntity.ok(rentalService.returnRental(id, userId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<RentalResponse>> myRentals(JwtAuthenticationToken authentication) {
        Long userId = Long.parseLong(authentication.getName());
        return ResponseEntity.ok(rentalService.findByUserId(userId));
    }

    @GetMapping("/stats/most-rented")
    public ResponseEntity<List<Map<String, Object>>> mostRented() {
        return ResponseEntity.ok(rentalService.getMostRentedEquipments());
    }
}