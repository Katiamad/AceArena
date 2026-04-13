package com.tennis.equipmentservice.service;

import com.tennis.equipmentservice.config.RabbitConfig;
import com.tennis.equipmentservice.events.AdminAlertEvent;
import com.tennis.equipmentservice.events.EquipmentEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class EquipmentEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public EquipmentEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishRented(Long userId, String equipmentName, int quantity) {
        EquipmentEvent event = new EquipmentEvent(
                userId.toString(),
                "Équipement loué",
                "Vous avez loué " + quantity + "x \"" + equipmentName + "\" avec succès.",
                "EQUIPMENT_RENTED",
                equipmentName,
                null
        );
        rabbitTemplate.convertAndSend(RabbitConfig.EQUIPMENT_EVENT_QUEUE, event);
    }

    public void publishPaid(Long userId, String equipmentNames) {
        EquipmentEvent event = new EquipmentEvent(
                userId.toString(),
                "Paiement confirmé",
                "Le paiement de votre location \"" + equipmentNames + "\" a été validé avec succès.",
                "EQUIPMENT_PAID",
                equipmentNames,
                null
        );
        rabbitTemplate.convertAndSend(RabbitConfig.EQUIPMENT_EVENT_QUEUE, event);
    }

    public void publishCanceled(Long userId, String equipmentNames) {
        EquipmentEvent event = new EquipmentEvent(
                userId.toString(),
                "Location annulée",
                "Votre location de \"" + equipmentNames + "\" a été annulée.",
                "STOCK_UPDATED",
                equipmentNames,
                null
        );
        rabbitTemplate.convertAndSend(RabbitConfig.EQUIPMENT_EVENT_QUEUE, event);
    }

    public void publishReturned(Long userId, String equipmentNames) {
        EquipmentEvent event = new EquipmentEvent(
                userId.toString(),
                "Retour confirmé",
                "Le retour de \"" + equipmentNames + "\" a bien été enregistré. Merci !",
                "STOCK_UPDATED",
                equipmentNames,
                null
        );
        rabbitTemplate.convertAndSend(RabbitConfig.EQUIPMENT_EVENT_QUEUE, event);
    }

    public void publishReturnReminder(Long userId, String equipmentName, String returnDate) {
        EquipmentEvent event = new EquipmentEvent(
                userId.toString(),
                "Rappel de retour",
                "Pensez à rendre \"" + equipmentName + "\" avant le " + returnDate + ".",
                "EQUIPMENT_RETURN_REMINDER",
                equipmentName,
                returnDate
        );
        rabbitTemplate.convertAndSend(RabbitConfig.EQUIPMENT_EVENT_QUEUE, event);
    }

    public void publishStockUpdated(Long userId, String equipmentName) {
        EquipmentEvent event = new EquipmentEvent(
                userId.toString(),
                "Stock mis à jour",
                "Le stock de \"" + equipmentName + "\" a été mis à jour.",
                "STOCK_UPDATED",
                equipmentName,
                null
        );
        rabbitTemplate.convertAndSend(RabbitConfig.EQUIPMENT_EVENT_QUEUE, event);
    }

    // 👇 Utilise maintenant ADMIN_ALERT_QUEUE + AdminAlertEvent — plus de userId
    public void publishLowStockAlert(String equipmentName, int stockRemaining) {
        AdminAlertEvent event = new AdminAlertEvent(
                "⚠️ Stock faible — " + equipmentName,
                "Il ne reste que " + stockRemaining + " unité(s) de \"" + equipmentName + "\". Pensez à réapprovisionner.",
                "LOW_STOCK_ALERT",
                equipmentName
        );
        rabbitTemplate.convertAndSend(RabbitConfig.ADMIN_ALERT_QUEUE, event);
    }

    // 👇 Idem — ADMIN_ALERT_QUEUE + AdminAlertEvent — plus de userId
    public void publishOutOfStock(String equipmentName) {
        AdminAlertEvent event = new AdminAlertEvent(
                "❌ Rupture de stock — " + equipmentName,
                "L'équipement \"" + equipmentName + "\" est en rupture totale de stock.",
                "LOW_STOCK_ALERT",
                equipmentName
        );
        rabbitTemplate.convertAndSend(RabbitConfig.ADMIN_ALERT_QUEUE, event);
    }

    public void publishRestocked(Long userId, String equipmentName) {
        EquipmentEvent event = new EquipmentEvent(
                userId.toString(),
                "🎉 Équipement disponible !",
                "L'équipement \"" + equipmentName + "\" que vous attendiez est de nouveau disponible. Dépêchez-vous !",
                "EQUIPMENT_RESTOCKED",
                equipmentName,
                null
        );
        rabbitTemplate.convertAndSend(RabbitConfig.EQUIPMENT_EVENT_QUEUE, event);
    }
}