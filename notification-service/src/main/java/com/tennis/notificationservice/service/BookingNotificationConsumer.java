package com.tennis.notificationservice.service;

import com.tennis.notificationservice.config.RabbitConfig;
import com.tennis.notificationservice.entity.Notification;
import com.tennis.notificationservice.entity.NotificationType;
import com.tennis.notificationservice.evenements.BookingEvent;
import com.tennis.notificationservice.repository.NotificationRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class BookingNotificationConsumer {

    private final NotificationRepository notificationRepository;

    public BookingNotificationConsumer(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @RabbitListener(queues = RabbitConfig.BOOKING_EVENT_QUEUE)
    public void receive(BookingEvent event) {

        String title;
        String message;
        NotificationType type;

        switch (event.getStatus()) {
            case "CONFIRMED" -> {
                title = "Reservation confirmee !";
                message = "Votre reservation #" + event.getBookingId()
                        + (event.getCourtName() != null ? " sur le terrain " + event.getCourtName() : "")
                        + " est confirmee. Bon match !";
                type = NotificationType.BOOKING_CONFIRMED;
            }
            case "CANCELLED" -> {
                title = "Reservation annulee";
                message = "Votre reservation #" + event.getBookingId() + " a ete annulee.";
                type = NotificationType.BOOKING_CANCELLED;
            }
            default -> {
                title = "Reservation";
                message = event.getMessage() != null ? event.getMessage()
                        : "Mise a jour de votre reservation #" + event.getBookingId();
                type = NotificationType.BOOKING_CONFIRMED;
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
}
