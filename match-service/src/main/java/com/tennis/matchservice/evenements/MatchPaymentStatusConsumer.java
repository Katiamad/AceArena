package com.tennis.matchservice.evenements;

import com.tennis.matchservice.entities.Match;
import com.tennis.matchservice.entities.MatchParticipant;
import com.tennis.matchservice.entities.MatchStatus;
import com.tennis.matchservice.repositories.MatchParticipantRepository;
import com.tennis.matchservice.repositories.MatchRepository;
import com.tennis.matchservice.service.NotificationProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Recoit le resultat du paiement d'UN joueur depuis payment-service.
 *
 * Flow par joueur :
 *   1. Joueur rejoint -> MatchController publie MatchPaymentRequestEvent
 *   2. payment-service traite -> publie MatchPaymentStatusEvent (ce consumer)
 *   3. On marque ce joueur hasPaid=true
 *   4. Si TOUS ont paye -> publishMatchBookingPaid(isPaid=true)
 *      -> booking-service -> CONFIRMED
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MatchPaymentStatusConsumer {

    private final MatchRepository              matchRepository;
    private final MatchParticipantRepository   participantRepository;
    private final BookingMatchDelegateConsumer  bookingPublisher;
    private final NotificationProducer         notificationProducer;

    @RabbitListener(queues = "${rabbitmq.queues.payment-to-match:payment.match.queue}")
    public void handleMatchPaymentStatus(MatchPaymentStatusEvent event) {
        log.info("[MatchPaymentConsumer] Paiement joueur -> matchId={}, userId={}, paid={}",
                event.getMatchId(), event.getUserId(), event.isPaid());

        try {
            Match match = matchRepository.findById(event.getMatchId()).orElse(null);
            if (match == null) {
                log.error("[MatchPaymentConsumer] Match #{} introuvable", event.getMatchId());
                return;
            }

            // Trouver le participant concerne
            MatchParticipant participant = participantRepository
                    .findByMatch_IdAndUserId(event.getMatchId(), Long.parseLong(event.getUserId()))
                    .orElse(null);

            if (participant == null) {
                log.error("[MatchPaymentConsumer] Participant userId={} introuvable dans match #{}",
                        event.getUserId(), event.getMatchId());
                return;
            }

            if (event.isPaid()) {
                // Marquer CE joueur comme ayant paye
                participant.setHasPaid(true);
                participant.setPaidAt(LocalDateTime.now());
                participantRepository.save(participant);

                log.info("[MatchPaymentConsumer] Joueur {} a paye sa part pour match #{}",
                        event.getUserId(), event.getMatchId());

                // Compter combien ont paye
                long paidCount   = participantRepository.countByMatch_IdAndHasPaidTrue(event.getMatchId());
                long totalPlayers = participantRepository.countByMatch_Id(event.getMatchId());

                log.info("[MatchPaymentConsumer] Match #{} - {}/{} joueurs ont paye",
                        event.getMatchId(), paidCount, totalPlayers);

                // Notification : joueur a paye
                notificationProducer.sendNotification(new MatchEvent(
                        event.getMatchId(),
                        Long.parseLong(event.getUserId()),
                        "PAID",
                        LocalDateTime.now()));

                // TOUS ont paye -> terrain reserve
                if (paidCount >= match.getMaxPlayers()) {
                    match.setStatus(MatchStatus.COMPLETED);
                    matchRepository.save(match);

                    log.info("[MatchPaymentConsumer] Tous les joueurs ont paye -> match #{} COMPLETED",
                            event.getMatchId());

                    // Notification : match complet et paye, pret a jouer !
                    notificationProducer.sendNotification(new MatchEvent(
                            event.getMatchId(),
                            Long.parseLong(event.getUserId()),
                            "COMPLETED",
                            LocalDateTime.now()));

                    // Notifier booking-service : terrain confirme
                    bookingPublisher.publishMatchBookingPaid(
                            event.getBookingId(),
                            event.getMatchId(),
                            event.getUserId(),
                            event.getAmountPaid() != null ? event.getAmountPaid().doubleValue() : 0.0,
                            true
                    );
                } else {
                    // Notification : il manque des joueurs
                    long remaining = match.getMaxPlayers() - paidCount;
                    notificationProducer.sendNotification(new MatchEvent(
                            event.getMatchId(),
                            Long.parseLong(event.getUserId()),
                            "WAITING_PLAYERS",
                            LocalDateTime.now()));
                }

            } else {
                // Paiement echoue pour ce joueur
                log.warn("[MatchPaymentConsumer] Paiement echoue pour userId={} dans match #{}",
                        event.getUserId(), event.getMatchId());

                notificationProducer.sendNotification(new MatchEvent(
                        event.getMatchId(),
                        Long.parseLong(event.getUserId()),
                        "PAYMENT_FAILED",
                        LocalDateTime.now()));
            }

        } catch (Exception e) {
            log.error("[MatchPaymentConsumer] Erreur matchId={} : {}", event.getMatchId(), e.getMessage(), e);
            throw e;
        }
    }
}
