package com.tennis.matchservice.service;

import com.tennis.matchservice.config.RabbitConfig;
import com.tennis.matchservice.evenements.MatchEvent;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.stereotype.Component;

@Component
public class NotificationProducer {

    private final AmqpTemplate amqpTemplate;

    public NotificationProducer(AmqpTemplate amqpTemplate) {
        this.amqpTemplate = amqpTemplate;
    }

    public void sendNotification(MatchEvent event) {
        amqpTemplate.convertAndSend(RabbitConfig.MATCH_EVENT_QUEUE, event);
    }

}
