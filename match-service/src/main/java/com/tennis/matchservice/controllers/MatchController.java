package com.tennis.matchservice.controllers;

import com.tennis.matchservice.dto.MatchRequestDTO;
import com.tennis.matchservice.entities.Match;
import com.tennis.matchservice.entities.MatchParticipant;
import com.tennis.matchservice.entities.MatchStatus;
import com.tennis.matchservice.evenements.BookingMatchDelegateConsumer;
import com.tennis.matchservice.evenements.MatchEvent;
import com.tennis.matchservice.repositories.MatchParticipantRepository;
import com.tennis.matchservice.repositories.MatchRepository;
import com.tennis.matchservice.service.NotificationProducer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/matchs")
public class MatchController {

    private final MatchRepository matchRepository;
    private final MatchParticipantRepository participantRepository;
    private final BookingMatchDelegateConsumer bookingConsumer;
    private final NotificationProducer notificationProducer;

    public MatchController(MatchRepository matchRepository,
                           MatchParticipantRepository participantRepository,
                           BookingMatchDelegateConsumer bookingConsumer,
                           NotificationProducer notificationProducer) {
        this.matchRepository = matchRepository;
        this.participantRepository = participantRepository;
        this.bookingConsumer = bookingConsumer;
        this.notificationProducer = notificationProducer;
    }

    // ── Helper : formater le créneau pour les notifications ──────────────────
    private String formatSlotInfo(Match match) {
        if (match.getSlotStartTime() == null) return "";
        try {
            LocalDateTime start = LocalDateTime.parse(match.getSlotStartTime().replace("Z", ""));
            String formatted = start.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
            return formatted;
        } catch (Exception e) {
            return match.getSlotStartTime();
        }
    }

    private MatchEvent enrichedEvent(Match match, Long userId, String type,
                                     String firstName, String lastName) {
        MatchEvent event = new MatchEvent();
        event.setMatchId(match.getId());
        event.setUserId(userId);
        event.setType(type);
        event.setTimestamp(LocalDateTime.now());
        event.setPlayerFirstName(firstName);
        event.setPlayerLastName(lastName);
        event.setCourtName(match.getCourtName());
        event.setSlotInfo(formatSlotInfo(match));
        return event;
    }

    // -----------------------------
    // 1. INITIER UN MATCH
    // -----------------------------
    @PostMapping("/initiate")
    public ResponseEntity<?> initiateMatch(
            @RequestBody MatchRequestDTO dto,
            JwtAuthenticationToken authentication
    ) {
        try {
            Long userId = Long.parseLong(authentication.getName());
            String firstName = (String) authentication.getTokenAttributes().get("firstName");
            String lastName = (String) authentication.getTokenAttributes().get("lastName");

            // Vérifier si un match existe déjà pour ce bookingId
            Optional<Match> existing = matchRepository.findByBookingId(dto.getBookingId());
            if (existing.isPresent()) {
                log.info("[MatchController] Match déjà existant pour bookingId={}", dto.getBookingId());
                return ResponseEntity.ok(existing.get());
            }

            int maxPlayers = "1VS1".equalsIgnoreCase(dto.getMatchType()) ? 2 : 4;
            double totalPrice = dto.getTotalCourtPrice() != null ? dto.getTotalCourtPrice() : 0.0;
            double pricePerPlayer = totalPrice / maxPlayers;

            Match match = Match.builder()
                    .bookingId(dto.getBookingId())
                    .ownerUserId(userId)
                    .ownerFirstName(firstName)
                    .ownerLastName(lastName)
                    .matchType(dto.getMatchType())
                    .maxPlayers(maxPlayers)
                    .totalCourtPrice(totalPrice)
                    .pricePerPlayer(pricePerPlayer)
                    .courtName(dto.getCourtName())
                    .slotStartTime(dto.getSlotStartTime())
                    .slotEndTime(dto.getSlotEndTime())
                    .status(MatchStatus.OPEN)
                    .build();

            Match savedMatch = matchRepository.save(match);

            // Le créateur est ajouté comme participant (hasPaid=false, doit payer aussi)
            MatchParticipant owner = MatchParticipant.builder()
                    .match(savedMatch)
                    .userId(userId)
                    .userFirstName(firstName)
                    .userLastName(lastName)
                    .hasPaid(false)
                    .joinedAt(LocalDateTime.now())
                    .build();
            participantRepository.save(owner);

            // Notification : match créé
            try {
                notificationProducer.sendNotification(
                        enrichedEvent(savedMatch, userId, "CREATED", firstName, lastName));
            } catch (Exception e) {
                log.warn("[MatchController] Notification échouée pour match #{}: {}", savedMatch.getId(), e.getMessage());
            }

            // Le paiement se fait manuellement via la page PaymentPage (REST API)
            // PAS de publishMatchPaymentRequest ici (évite le double-paiement auto + manuel)

            log.info("[MatchController] Match #{} créé (bookingId={}, type={}, terrain={})",
                    savedMatch.getId(), dto.getBookingId(), dto.getMatchType(), dto.getCourtName());

            return ResponseEntity.ok(savedMatch);

        } catch (Exception e) {
            log.error("[MatchController] Erreur création match: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("message", "Erreur lors de la création du match: " + e.getMessage()));
        }
    }

    // -----------------------------
    // 2. LISTE DES MATCHS DISPONIBLES
    // -----------------------------
    @GetMapping("/available")
    public List<Match> getAvailableMatchs() {
        return matchRepository.findByStatusWithParticipants(MatchStatus.OPEN);
    }

    // -----------------------------
    // 3. REJOINDRE UN MATCH (crée un participant PENDING, paiement obligatoire)
    // -----------------------------
    @PostMapping("/{matchId}/join")
    public ResponseEntity<?> joinMatch(
            @PathVariable Long matchId,
            JwtAuthenticationToken authentication) {

        Long   userId    = Long.parseLong(authentication.getName());
        String firstName = (String) authentication.getTokenAttributes().get("firstName");
        String lastName  = (String) authentication.getTokenAttributes().get("lastName");

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match non trouve"));

        if (match.getStatus() != MatchStatus.OPEN)
            return ResponseEntity.badRequest().body(Map.of("message", "Ce match n'est plus disponible."));

        if (participantRepository.existsByMatch_IdAndUserId(matchId, userId))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vous etes deja inscrit a ce match.");

        // Vérifier si le match est complet (tous les slots pris, payés ou non)
        long currentCount = participantRepository.countByMatch_Id(matchId);
        if (currentCount >= match.getMaxPlayers())
            return ResponseEntity.badRequest().body(Map.of("message", "Match complet."));

        // Créer le participant avec hasPaid=false (paiement obligatoire)
        MatchParticipant participant = MatchParticipant.builder()
                .match(match)
                .userId(userId)
                .userFirstName(firstName)
                .userLastName(lastName)
                .hasPaid(false)
                .status("PENDING")
                .joinedAt(LocalDateTime.now())
                .build();
        participantRepository.save(participant);

        long newCount = currentCount + 1;

        // Notification à TOUS les participants : un joueur a rejoint
        List<MatchParticipant> allParticipants = participantRepository.findByMatch_Id(matchId);
        for (MatchParticipant p : allParticipants) {
            if (!p.getUserId().equals(userId)) {
                notificationProducer.sendNotification(
                        enrichedEvent(match, p.getUserId(), "JOINED", firstName, lastName));
            }
        }

        // Marquer FULL si complet
        if (newCount >= match.getMaxPlayers()) {
            match.setStatus(MatchStatus.FULL);
            matchRepository.save(match);
            log.info("[MatchController] Match #{} est maintenant FULL", matchId);

            // Notification à tous : match complet
            for (MatchParticipant p : allParticipants) {
                notificationProducer.sendNotification(
                        enrichedEvent(match, p.getUserId(), "FULL", firstName, lastName));
            }
        }

        // Le paiement se fait manuellement via la page PaymentPage (REST API)
        // PAS de publishMatchPaymentRequest ici (évite le double-paiement auto + manuel)

        return ResponseEntity.ok(Map.of(
                "message", "Inscription enregistrée ! Vous devez maintenant payer votre part.",
                "pricePerPlayer", match.getPricePerPlayer(),
                "matchId", match.getId(),
                "bookingId", match.getBookingId(),
                "matchType", match.getMatchType(),
                "courtName", match.getCourtName() != null ? match.getCourtName() : "",
                "slotStartTime", match.getSlotStartTime() != null ? match.getSlotStartTime() : "",
                "requiresPayment", true
        ));
    }

    // -----------------------------
    // 4. QUITTER UN MATCH
    // -----------------------------
    @PostMapping("/{matchId}/leave")
    public ResponseEntity<?> leaveMatch(
            @PathVariable Long matchId,
            Authentication authentication
    ) {
        Long userId = Long.parseLong(authentication.getName());

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match non trouve"));

        MatchParticipant participant = participantRepository.findByMatch_IdAndUserId(matchId, userId)
                .orElseThrow(() -> new RuntimeException("Vous n'etes pas dans ce match."));

        participantRepository.delete(participant);

        if (match.getStatus() == MatchStatus.FULL) {
            match.setStatus(MatchStatus.OPEN);
            matchRepository.save(match);
        }

        // Notification à tous les autres : joueur a quitté
        List<MatchParticipant> remaining = participantRepository.findByMatch_Id(matchId);
        for (MatchParticipant p : remaining) {
            notificationProducer.sendNotification(
                    enrichedEvent(match, p.getUserId(), "LEFT",
                            participant.getUserFirstName(), participant.getUserLastName()));
        }

        return ResponseEntity.ok("Vous avez quitte le match.");
    }

    // -----------------------------
    // 5. ANNULER UN MATCH
    // -----------------------------
    @DeleteMapping("/{matchId}/cancel")
    public ResponseEntity<?> cancelMatch(
            @PathVariable Long matchId,
            Authentication authentication
    ) {
        Long userId = Long.parseLong(authentication.getName());

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match non trouve"));

        if (!match.getOwnerUserId().equals(userId)) {
            return ResponseEntity.badRequest().body("Seul le createur peut annuler ce match.");
        }

        match.setStatus(MatchStatus.CANCELLED);
        matchRepository.save(match);

        // Notification à tous les participants : match annulé
        List<MatchParticipant> allParticipants = participantRepository.findByMatch_Id(matchId);
        for (MatchParticipant p : allParticipants) {
            notificationProducer.sendNotification(
                    enrichedEvent(match, p.getUserId(), "CANCELLED",
                            match.getOwnerFirstName(), match.getOwnerLastName()));
        }

        return ResponseEntity.ok("Match annule.");
    }

    // -----------------------------
    // 6. MES MATCHS
    // -----------------------------
    @GetMapping("/my")
    public ResponseEntity<?> getMyMatches(Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        List<Long> matchIds = participantRepository.findMatchIdsByUserId(userId);
        if (matchIds.isEmpty()) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(matchRepository.findByIdsWithParticipants(matchIds));
    }
}
