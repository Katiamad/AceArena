package com.tennis.matchservice.evenements;

import com.tennis.matchservice.entities.Match;
import com.tennis.matchservice.entities.MatchParticipant;
import com.tennis.matchservice.entities.MatchStatus;
import com.tennis.matchservice.repositories.MatchParticipantRepository;
import com.tennis.matchservice.repositories.MatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingMatchDelegateConsumer {

    private final MatchRepository            matchRepository;
    private final MatchParticipantRepository participantRepository;
    private final RabbitTemplate             rabbitTemplate;

    @Value("${rabbitmq.exchanges.match-exchange:match.exchange}")
    private String matchExchange;

    @Value("${rabbitmq.exchanges.payment-exchange:payment.exchange}")
    private String paymentExchange;

    @Value("${rabbitmq.routing-keys.match-booking-paid:match.booking.paid}")
    private String matchBookingPaidKey;

    @Value("${rabbitmq.routing-keys.match-payment-request:match.payment.request}")
    private String matchPaymentRequestKey;

    // ─── 1. Réception event depuis booking-service ────────────────────────────

    @RabbitListener(queues = "${rabbitmq.queues.booking-to-match:booking.match.queue}")
    public void handleBookingMatchDelegate(BookingMatchDelegateEvent event) {
        // Le match est créé via le endpoint HTTP /api/matchs/initiate
        // (l'utilisateur choisit le matchType 1VS1/2VS2 APRÈS la réservation).
        // Ce consumer se contente de loguer l'événement pour audit.
        log.info("[MatchConsumer] BookingMatchDelegate reçu → bookingId={}, userId={}, terrain={}",
                event.getBookingId(), event.getUserId(), event.getCourtName());
    }

    // ─── 2. Publication vers payment-service quand match FULL ─────────────────

    /**
     * Appelé depuis MatchController.joinMatch() quand match.status == FULL.
     * Délègue le paiement à payment-service.
     */
    /**
     * Appelé pour chaque joueur qui rejoint (owner inclus).
     * Chaque joueur paie uniquement pricePerPlayer.
     */
    public void publishMatchPaymentRequest(Match match, String userId) {
        MatchPaymentRequestEvent event = MatchPaymentRequestEvent.builder()
                .matchId(match.getId())
                .bookingId(match.getBookingId())
                .userId(userId)
                .nbPlayers(match.getMaxPlayers())
                .totalPrice(BigDecimal.valueOf(match.getTotalCourtPrice() != null ? match.getTotalCourtPrice() : 0.0))
                .pricePerPlayer(BigDecimal.valueOf(match.getPricePerPlayer() != null ? match.getPricePerPlayer() : 0.0))
                .createdAt(LocalDateTime.now())
                .build();

        try {
            rabbitTemplate.convertAndSend(paymentExchange, matchPaymentRequestKey, event);
            log.info("[MatchPublisher] MatchPaymentRequest publié → matchId={}, userId={}, part={}€",
                    match.getId(), userId, event.getPricePerPlayer());
        } catch (Exception e) {
            log.error("[MatchPublisher] Échec MatchPaymentRequest matchId={} : {}", match.getId(), e.getMessage(), e);
        }
    }

    // ─── 3. Publication vers booking-service (résultat final) ─────────────────

    /**
     * Appelé depuis MatchPaymentStatusConsumer après réponse de payment-service.
     */
    public void publishMatchBookingPaid(Long bookingId, Long matchId,
                                        String userId, double amountPaid, boolean isPaid) {
        MatchBookingPaidEvent event = MatchBookingPaidEvent.builder()
                .bookingId(bookingId)
                .matchId(matchId)
                .userId(userId)
                .isPaid(isPaid)
                .amountPaid(BigDecimal.valueOf(amountPaid))
                .processedAt(LocalDateTime.now())
                .build();

        try {
            rabbitTemplate.convertAndSend(matchExchange, matchBookingPaidKey, event);
            log.info("[MatchPublisher] MatchBookingPaid publié → bookingId={}, matchId={}, paid={}",
                    bookingId, matchId, isPaid);
        } catch (Exception e) {
            log.error("[MatchPublisher] Échec MatchBookingPaid : {}", e.getMessage(), e);
        }
    }
}