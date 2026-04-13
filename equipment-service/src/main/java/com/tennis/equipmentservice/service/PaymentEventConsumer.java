package com.tennis.equipmentservice.service;

import com.tennis.equipmentservice.config.RabbitConfig;
import com.tennis.equipmentservice.entity.Rental;
import com.tennis.equipmentservice.entity.RentalStatus;
import com.tennis.equipmentservice.events.PaymentEvent;
import com.tennis.equipmentservice.repository.RentalRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
public class PaymentEventConsumer {

    private final RentalRepository rentalRepository;
    private final EquipmentEventPublisher eventPublisher;

    public PaymentEventConsumer(RentalRepository rentalRepository,
                                EquipmentEventPublisher eventPublisher) {
        this.rentalRepository = rentalRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    @RabbitListener(queues = RabbitConfig.PAYMENT_EVENT_QUEUE)
    public void receive(PaymentEvent event) {
        if (event.getRentalId() == null || event.getRentalId() == 0) return;

        Optional<Rental> optional = rentalRepository.findById(event.getRentalId());
        if (optional.isEmpty()) return;

        Rental rental = optional.get();

        if ("PAID".equals(event.getStatus())) {
            rental.setStatus(RentalStatus.PAID);
            rentalRepository.save(rental);

            // Notification : paiement location confirmé
            String equipmentNames = rental.getItems().stream()
                    .map(item -> item.getEquipment().getName())
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("Équipement");
            eventPublisher.publishPaid(rental.getUserId(), equipmentNames);
        } else {
            rentalRepository.save(rental);
        }
    }
}