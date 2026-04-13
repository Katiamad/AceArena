package com.tennis.equipmentservice.service;

import com.tennis.equipmentservice.dto.*;
import com.tennis.equipmentservice.entity.Equipment;
import com.tennis.equipmentservice.entity.EquipmentStatus;
import com.tennis.equipmentservice.entity.EquipmentWaitlist;
import com.tennis.equipmentservice.exception.BadRequestException;
import com.tennis.equipmentservice.exception.NotFoundException;
import com.tennis.equipmentservice.repository.EquipmentRepository;
import com.tennis.equipmentservice.repository.EquipmentWaitlistRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentEventPublisher eventPublisher;
    private final EquipmentWaitlistRepository waitlistRepository; // 👈 ajout

    public EquipmentService(EquipmentRepository equipmentRepository,
                            EquipmentEventPublisher eventPublisher,
                            EquipmentWaitlistRepository waitlistRepository) { // 👈 ajout
        this.equipmentRepository = equipmentRepository;
        this.eventPublisher = eventPublisher;
        this.waitlistRepository = waitlistRepository; // 👈 ajout
    }

    public EquipmentResponse create(EquipmentCreateRequest req, Long userId, String firstName, String lastName) {
        if (req.stockAvailable() > req.stockTotal())
            throw new BadRequestException("stockAvailable cannot be greater than stockTotal");
        if (req.stockTotal() < 0 || req.stockAvailable() < 0)
            throw new BadRequestException("Stock values cannot be negative");

        Equipment equipment = Equipment.builder()
                .clubId(req.clubId())
                .name(req.name())
                .category(req.category())
                .stockTotal(req.stockTotal())
                .stockAvailable(req.stockAvailable())
                .status(EquipmentStatus.ACTIVE)
                .createdByUserId(userId)
                .createdByFirstName(firstName)
                .createdByLastName(lastName)
                .build();

        return toResponse(equipmentRepository.save(equipment));
    }

    @Transactional
    public EquipmentResponse update(Long id, EquipmentUpdateRequest req, Long userId, String firstName, String lastName) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Equipment not found: " + id));

        if (req.version() == null)
            throw new BadRequestException("Version is required for update");
        if (!equipment.getVersion().equals(req.version()))
            throw new jakarta.persistence.OptimisticLockException("Concurrent modification detected");

        if (req.name() != null) {
            boolean exists = equipmentRepository.existsByClubIdAndNameIgnoreCase(equipment.getClubId(), req.name());
            if (exists && !equipment.getName().equalsIgnoreCase(req.name()))
                throw new BadRequestException("Equipment with same name already exists in this club");
            equipment.setName(req.name());
        }

        if (req.clubId() != null) equipment.setClubId(req.clubId());
        if (req.category() != null) equipment.setCategory(req.category());
        if (req.status() != null) equipment.setStatus(req.status());

        Integer newStockTotal = req.stockTotal() != null ? req.stockTotal() : equipment.getStockTotal();
        Integer newStockAvailable = req.stockAvailable() != null ? req.stockAvailable() : equipment.getStockAvailable();

        if (newStockTotal < 0) throw new BadRequestException("stockTotal cannot be negative");
        if (newStockAvailable < 0) throw new BadRequestException("stockAvailable cannot be negative");
        if (newStockAvailable > newStockTotal) throw new BadRequestException("stockAvailable cannot be greater than stockTotal");
        if (newStockTotal < equipment.getStockAvailable()) throw new BadRequestException("stockTotal cannot be lower than current stockAvailable");

        // 👇 Détecter si le stock repasse de 0 à > 0 AVANT de modifier
        boolean wasOutOfStock = equipment.getStockAvailable() == 0;
        boolean willBeAvailable = newStockAvailable > 0;

        equipment.setStockTotal(newStockTotal);
        equipment.setStockAvailable(newStockAvailable);
        equipment.setUpdatedByUserId(userId);
        equipment.setUpdatedByFirstName(firstName);
        equipment.setUpdatedByLastName(lastName);

        EquipmentResponse saved = toResponse(equipmentRepository.save(equipment));

        // Notif stock mis à jour par un admin
        if (req.stockAvailable() != null || req.stockTotal() != null) {
            eventPublisher.publishStockUpdated(userId, equipment.getName());
        }

        // 👇 Notifier la waitlist si le stock repasse de 0 à > 0
        if (wasOutOfStock && willBeAvailable) {
            List<EquipmentWaitlist> waitlist = waitlistRepository.findByEquipmentId(id);
            for (EquipmentWaitlist entry : waitlist) {
                eventPublisher.publishRestocked(entry.getUserId(), equipment.getName());
            }
            if (!waitlist.isEmpty()) {
                waitlistRepository.deleteByEquipmentId(id);
            }
        }

        return saved;
    }

    // 👇 Nouvelle méthode — inscription à la waitlist
    public void notifyMe(Long equipmentId, Long userId) {
        // Vérifier que l'équipement existe
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new NotFoundException("Equipment not found: " + equipmentId));

        // Vérifier que le stock est bien à 0
        if (equipment.getStockAvailable() > 0) {
            throw new BadRequestException("Equipment is already available");
        }

        // Vérifier que l'user n'est pas déjà inscrit
        if (waitlistRepository.existsByEquipmentIdAndUserId(equipmentId, userId)) {
            return; // déjà inscrit, pas d'erreur
        }

        EquipmentWaitlist entry = EquipmentWaitlist.builder()
                .equipmentId(equipmentId)
                .userId(userId)
                .createdAt(LocalDateTime.now())
                .build();

        waitlistRepository.save(entry);
    }

    public List<EquipmentResponse> findAll() {
        return equipmentRepository.findAll().stream().map(this::toResponse).toList();
    }

    public EquipmentResponse findById(Long id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Equipment not found: " + id));
        return toResponse(equipment);
    }

    public List<EquipmentResponse> findByClub(Long clubId) {
        return equipmentRepository.findByClubId(clubId).stream()
                .map(this::toResponse).toList();
    }

    public List<EquipmentResponse> findAvailableByClub(Long clubId) {
        return equipmentRepository.findByClubIdAndStatusAndStockAvailableGreaterThan(
                clubId, EquipmentStatus.ACTIVE, 0
        ).stream().map(this::toResponse).toList();
    }

    private EquipmentResponse toResponse(Equipment e) {
        return new EquipmentResponse(
                e.getId(),
                e.getClubId(),
                e.getName(),
                e.getCategory(),
                e.getStockTotal(),
                e.getStockAvailable(),
                e.getStatus(),
                e.getCreatedAt(),
                e.getUpdatedAt(),
                e.getVersion(),
                e.getCreatedByUserId(),
                e.getCreatedByFirstName(),
                e.getCreatedByLastName(),
                e.getUpdatedByUserId(),
                e.getUpdatedByFirstName(),
                e.getUpdatedByLastName()
        );
    }
}