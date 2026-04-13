package com.tennis.authservice.controleur;

import com.tennis.authservice.controleur.dtos.AuthResponseDTO;
import com.tennis.authservice.controleur.dtos.LoginDTO;
import com.tennis.authservice.controleur.dtos.RegisterDTO;
import com.tennis.authservice.modele.FacadeAuth;
import com.tennis.authservice.modele.Utilisateur;
import com.tennis.authservice.modele.exceptions.LoginDejaUtiliseException;
import com.tennis.authservice.modele.exceptions.UtilisateurInexistantException;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.tennis.authservice.controleur.dtos.MeDTO;
import com.tennis.authservice.controleur.dtos.PlanDTO;
import com.tennis.authservice.controleur.dtos.SubscribeDTO;
import com.tennis.authservice.modele.UserSubscription;
import java.util.List;
import java.util.stream.Collectors;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class Controleur {

    private final FacadeAuth facadeAuth;

    public Controleur(FacadeAuth facadeAuth) {
        this.facadeAuth = facadeAuth;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterDTO dto) {

        try {

            Utilisateur user = facadeAuth.register(
                    dto.getEmail(),
                    dto.getPassword(),
                    dto.getFirstName(),
                    dto.getLastName()
            );

            String token = facadeAuth.tokenForUser(user);

            return ResponseEntity.ok(
                    AuthResponseDTO.builder()
                            .token(token)
                            .build()
            );

        } catch (LoginDejaUtiliseException e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "Email déjà utilisé"));

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "Erreur register"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO dto) {

        try {

            Utilisateur user = facadeAuth.login(
                    dto.getEmail(),
                    dto.getPassword()
            );

            String token = facadeAuth.tokenForUser(user);

            return ResponseEntity.ok(
                    AuthResponseDTO.builder()
                            .token(token)
                            .build()
            );

        } catch (UtilisateurInexistantException e) {

            return ResponseEntity
                    .status(401)
                    .body(Map.of("message", "Email/mot de passe incorrect"));

        } catch (Exception e) {

            return ResponseEntity
                    .status(401)
                    .body(Map.of("message", "Erreur login"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity
                    .status(401)
                    .body(Map.of("message", "Non authentifié"));
        }

        Jwt jwt = (Jwt) authentication.getPrincipal();

        return ResponseEntity.ok(
                Map.of(
                        "message", "TOKEN OK",
                        "userId", jwt.getSubject(),
                        "email", jwt.getClaim("email")
                )
        );
    }

    @GetMapping("/me/{id}")
    public ResponseEntity<?> getMe(@PathVariable Long id) {
        try {
            Utilisateur user = facadeAuth.getById(id);


            MeDTO dto = MeDTO.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .nom(user.getFirstName() + " " + user.getLastName())
                    .role(user.getRole().name())
                    .build();

            return ResponseEntity.ok(dto);

        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("message", "Utilisateur introuvable"));
        }
    }

    @GetMapping("/plans")
    public ResponseEntity<?> getPlans() {
        List<PlanDTO> plans = facadeAuth.getAllPlans().stream()
                .map(p -> PlanDTO.builder()
                        .code(p.getCode())
                        .name(p.getName())
                        .weeklyQuota(p.getMaxBookingsPerWeek())
                        .allow2v2(p.isAllowDoubleMatches())
                        .durationDays(p.getDurationDays())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(plans);
    }

    @PostMapping("/subscribe/{userId}")
    public ResponseEntity<?> subscribe(@PathVariable Long userId, @RequestBody SubscribeDTO dto) {
        try {
            UserSubscription us = facadeAuth.subscribeA(userId, dto.getPlanCode());
            return ResponseEntity.ok(Map.of(
                    "message", "Abonnement activé",
                    "plan", us.getSubscription().getCode(),
                    "validUntil", us.getEndDate().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }


    @GetMapping("/admins")
    public ResponseEntity<List<Long>> getAdmins() {
        return ResponseEntity.ok(facadeAuth.getAdminAndManagerIds());
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            Utilisateur user = facadeAuth.updateProfile(
                    id,
                    body.get("email"),
                    body.get("firstName"),
                    body.get("lastName")
            );
            return ResponseEntity.ok(Map.of("message", "Profil mis à jour"));

        } catch (LoginDejaUtiliseException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email déjà utilisé"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erreur mise à jour"));
        }
    }

    @PutMapping("/change-password/{id}")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            facadeAuth.changePassword(
                    id,
                    body.get("currentPassword"),
                    body.get("newPassword")
            );
            return ResponseEntity.ok(Map.of("message", "Mot de passe mis à jour"));

        } catch (UtilisateurInexistantException e) {
            return ResponseEntity.status(404).body(Map.of("message", "Utilisateur introuvable"));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Mot de passe actuel incorrect"));
        }
    }
}