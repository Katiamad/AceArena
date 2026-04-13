package com.tennis.notificationservice.service;

import com.tennis.notificationservice.config.RabbitConfig;
import com.tennis.notificationservice.entity.Notification;
import com.tennis.notificationservice.entity.NotificationType;
import com.tennis.notificationservice.evenements.EquipmentEvent;
import com.tennis.notificationservice.repository.NotificationRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class EquipmentNotificationConsumer {

    private final NotificationRepository notificationRepository;

    public EquipmentNotificationConsumer(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @RabbitListener(queues = RabbitConfig.EQUIPMENT_EVENT_QUEUE)
    public void receive(EquipmentEvent event) {

        Notification notif = Notification.builder()
                .userId(Long.parseLong(event.getUserId()))
                .title(event.getTitle())
                .message(event.getMessage())
                .type(NotificationType.valueOf(event.getType()))
                .createdAt(LocalDateTime.now())
                .read(false)
                .build();

        notificationRepository.save(notif);
    }
}