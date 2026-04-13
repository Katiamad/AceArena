package com.tennis.notificationservice.service;

import com.tennis.notificationservice.config.RabbitConfig;
import com.tennis.notificationservice.entity.Notification;
import com.tennis.notificationservice.entity.NotificationType;
import com.tennis.notificationservice.evenements.MatchEvent;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import com.tennis.notificationservice.repository.NotificationRepository;

import java.time.LocalDateTime;

@Component
public class NotificationConsumer {

    private final NotificationRepository notificationRepository;

    public NotificationConsumer(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @RabbitListener(queues = RabbitConfig.MATCH_EVENT_QUEUE)
    public void receive(MatchEvent event) {

        String title;
        String message;
        NotificationType type;

        // Construire les infos de contexte
        String playerName = buildPlayerName(event);
        String courtInfo = buildCourtInfo(event);

        switch (event.getType()) {
            case "CREATED" -> {
                title = "Match cree";
                message = "Votre match" + courtInfo + " a ete cree. En attente de joueurs...";
                type = NotificationType.MATCH_CREATED;
            }
            case "JOINED" -> {
                title = "Joueur rejoint";
                message = playerName + " a rejoint le match" + courtInfo + ".";
                type = NotificationType.PLAYER_JOINED_MATCH;
            }
            case "FULL" -> {
                title = "Match complet !";
                message = "Le match" + courtInfo + " est maintenant complet. Tous les joueurs doivent payer leur part.";
                type = NotificationType.MATCH_FULL;
            }
            case "PAID" -> {
                title = "Paiement confirme";
                message = "Votre paiement pour le match" + courtInfo + " a ete accepte.";
                type = NotificationType.MATCH_PAYMENT_PAID;
            }
            case "COMPLETED" -> {
                title = "Match pret !";
                message = "Tous les joueurs ont paye pour le match" + courtInfo + ". Le match est pret a etre lance !";
                type = NotificationType.MATCH_COMPLETED;
            }
            case "WAITING_PLAYERS" -> {
                title = "En attente de joueurs";
                message = "Il manque encore des joueurs pour le match" + courtInfo + ".";
                type = NotificationType.MATCH_WAITING_PLAYERS;
            }
            case "PAYMENT_FAILED" -> {
                title = "Paiement echoue";
                message = "Votre paiement pour le match" + courtInfo + " a echoue. Veuillez reessayer.";
                type = NotificationType.MATCH_PAYMENT_FAILED;
            }
            case "LEFT" -> {
                title = "Joueur parti";
                message = playerName + " a quitte le match" + courtInfo + ".";
                type = NotificationType.PLAYER_JOINED_MATCH;
            }
            case "CANCELLED" -> {
                title = "Match annule";
                message = "Le match" + courtInfo + " a ete annule.";
                type = NotificationType.MATCH_CANCELLED;
            }
            default -> {
                title = "Notification match";
                message = "Evenement sur le match #" + event.getMatchId() + ".";
                type = NotificationType.PLAYER_JOINED_MATCH;
            }
        }

        Notification notif = Notification.builder()
                .userId(event.getUserId())
                .title(title)
                .message(message)
                .type(type)
                .createdAt(LocalDateTime.now())
                .read(false)
                .build();

        notificationRepository.save(notif);
    }

    private String buildPlayerName(MatchEvent event) {
        if (event.getPlayerFirstName() != null && event.getPlayerLastName() != null) {
            return event.getPlayerFirstName() + " " + event.getPlayerLastName();
        }
        return "Un joueur";
    }

    private String buildCourtInfo(MatchEvent event) {
        StringBuilder sb = new StringBuilder();
        if (event.getCourtName() != null && !event.getCourtName().isEmpty()) {
            sb.append(" au terrain ").append(event.getCourtName());
        }
        if (event.getSlotInfo() != null && !event.getSlotInfo().isEmpty()) {
            sb.append(" du creneau ").append(event.getSlotInfo());
        }
        if (sb.isEmpty()) {
            sb.append(" #").append(event.getMatchId());
        }
        return sb.toString();
    }
}
