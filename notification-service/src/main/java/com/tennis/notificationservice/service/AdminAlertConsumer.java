package com.tennis.notificationservice.service;

import com.tennis.notificationservice.client.AuthClient;
import com.tennis.notificationservice.config.RabbitConfig;
import com.tennis.notificationservice.entity.Notification;
import com.tennis.notificationservice.entity.NotificationType;
import com.tennis.notificationservice.evenements.AdminAlertEvent;
import com.tennis.notificationservice.repository.NotificationRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class AdminAlertConsumer {

    private final NotificationRepository notificationRepository;
    private final AuthClient authClient;

    public AdminAlertConsumer(NotificationRepository notificationRepository,
                              AuthClient authClient) {
        this.notificationRepository = notificationRepository;
        this.authClient = authClient;
    }

    @RabbitListener(queues = RabbitConfig.ADMIN_ALERT_QUEUE)
    public void receive(AdminAlertEvent event) {
        List<Long> adminIds;

        try {
            adminIds = authClient.getAdminAndManagerIds();
        } catch (Exception e) {
            // Si auth-service est indisponible, on log et on skip
            System.err.println("Cannot reach auth-service: " + e.getMessage());
            return;
        }

        for (Long adminId : adminIds) {
            Notification notif = Notification.builder()
                    .userId(adminId)
                    .title(event.getTitle())
                    .message(event.getMessage())
                    .type(NotificationType.valueOf(event.getType()))
                    .createdAt(LocalDateTime.now())
                    .read(false)
                    .build();
            notificationRepository.save(notif);
        }
    }
}