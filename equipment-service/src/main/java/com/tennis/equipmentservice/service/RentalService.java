package com.tennis.equipmentservice.service;

import com.tennis.equipmentservice.client.BookingClient;
import com.tennis.equipmentservice.dto.*;
import com.tennis.equipmentservice.entity.*;
import com.tennis.equipmentservice.exception.InsufficientStockException;
import com.tennis.equipmentservice.exception.NotFoundException;
import com.tennis.equipmentservice.repository.EquipmentRepository;
import com.tennis.equipmentservice.repository.RentalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import java.util.List;
import java.util.Map;

@Service
public class RentalService {

    private final RentalRepository rentalRepository;
    private final EquipmentRepository equipmentRepository;
    private final BookingClient bookingClient;
    private final EquipmentEventPublisher eventPublisher; // 👈 ajout

    public RentalService(RentalRepository rentalRepository,
                         EquipmentRepository equipmentRepository,
                         BookingClient bookingClient,
                         EquipmentEventPublisher eventPublisher) { // 👈 ajout
        this.rentalRepository = rentalRepository;
        this.equipmentRepository = equipmentRepository;
        this.bookingClient = bookingClient;
        this.eventPublisher = eventPublisher; // 👈 ajout
    }

    @Transactional
    public RentalResponse createRental(RentalCreateRequest req, Long userId, String firstName, String lastName) {

        if (req.items() == null || req.items().isEmpty()) {
            throw new IllegalArgumentException("Rental must contain at least one item.");
        }

        try {
            Rental rental = Rental.builder()
                    .bookingId(req.bookingId())
                    .userId(userId)
                    .userFirstName(firstName)
                    .userLastName(lastName)
                    .clubId(req.clubId())
                    .status(RentalStatus.CREATED)
                    .build();

            for (RentalItemRequest itemReq : req.items()) {
                Equipment equipment = equipmentRepository.findById(itemReq.equipmentId())
                        .orElseThrow(() -> new NotFoundException("Equipment not found: " + itemReq.equipmentId()));

                if (!equipment.getClubId().equals(req.clubId()))
                    throw new IllegalArgumentException("Equipment does not belong to this club.");

                if (equipment.getStatus() != EquipmentStatus.ACTIVE)
                    throw new InsufficientStockException("Equipment not active: " + equipment.getId());

                if (equipment.getStockAvailable() < itemReq.quantity())
                    throw new InsufficientStockException("Not enough stock for equipmentId=" + equipment.getId());

                equipment.setStockAvailable(equipment.getStockAvailable() - itemReq.quantity());
                equipmentRepository.save(equipment);

                // 👇 Vérification stock après la location
                int stockRestant = equipment.getStockAvailable();
                if (stockRestant == 0) {
                    eventPublisher.publishOutOfStock(equipment.getName());
                } else if (stockRestant <= 3) {
                    eventPublisher.publishLowStockAlert(equipment.getName(), stockRestant);
                }

                RentalItem rentalItem = RentalItem.builder()
                        .rental(rental)
                        .equipment(equipment)
                        .quantity(itemReq.quantity())
                        .build();

                rental.getItems().add(rentalItem);
            }

            Rental saved = rentalRepository.save(rental);

            // 👇 Notif location créée — une notif par équipement loué
            for (RentalItem item : saved.getItems()) {
                eventPublisher.publishRented(
                        userId,
                        item.getEquipment().getName(),
                        item.getQuantity()
                );
            }

            return toResponse(saved);

        } catch (ObjectOptimisticLockingFailureException e) {
            throw new InsufficientStockException("Concurrent stock modification detected. Please retry.");
        }
    }

    public List<RentalResponse> findAll() {
        return rentalRepository.findAll().stream().map(this::toResponse).toList();
    }

    public RentalResponse findById(Long id) {
        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Rental not found: " + id));
        return toResponse(rental);
    }

    @Transactional
    public RentalResponse cancel(Long id, Long userId) {
        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Rental not found: " + id));

        if (!rental.getUserId().equals(userId))
            throw new IllegalStateException("You are not allowed to cancel this rental.");

        if (rental.getStatus() == RentalStatus.CANCELED)
            return toResponse(rental);

        try {
            for (RentalItem item : rental.getItems()) {
                Equipment equipment = item.getEquipment();
                equipment.setStockAvailable(equipment.getStockAvailable() + item.getQuantity());
                equipmentRepository.save(equipment);
            }
        } catch (ObjectOptimisticLockingFailureException e) {
            throw new IllegalStateException("Concurrent modification during cancellation.");
        }

        rental.setStatus(RentalStatus.CANCELED);
        Rental saved = rentalRepository.save(rental);

        // 👇 Notif annulation — une notif groupée pour toute la location
        String equipmentNames = saved.getItems().stream()
                .map(i -> i.getEquipment().getName())
                .reduce((a, b) -> a + ", " + b)
                .orElse("équipements");

        eventPublisher.publishCanceled(userId, equipmentNames);

        return toResponse(saved);
    }

    @Transactional
    public RentalResponse returnRental(Long id, Long userId) {
        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Rental not found: " + id));

        if (!rental.getUserId().equals(userId))
            throw new IllegalStateException("You are not allowed to return this rental.");

        if (rental.getStatus() == RentalStatus.RETURNED)
            return toResponse(rental);

        if (rental.getStatus() == RentalStatus.CANCELED)
            throw new IllegalStateException("Cannot return a canceled rental.");

        try {
            for (RentalItem item : rental.getItems()) {
                Equipment equipment = item.getEquipment();
                equipment.setStockAvailable(equipment.getStockAvailable() + item.getQuantity());
                equipmentRepository.save(equipment);
            }
        } catch (ObjectOptimisticLockingFailureException e) {
            throw new IllegalStateException("Concurrent modification during return.");
        }

        rental.setStatus(RentalStatus.RETURNED);
        Rental saved = rentalRepository.save(rental);

        // 👇 Notif retour confirmé
        String equipmentNames = saved.getItems().stream()
                .map(i -> i.getEquipment().getName())
                .reduce((a, b) -> a + ", " + b)
                .orElse("équipements");

        eventPublisher.publishReturned(userId, equipmentNames);

        return toResponse(saved);
    }

    private RentalResponse toResponse(Rental rental) {
        List<RentalItemResponse> items = rental.getItems().stream()
                .map(i -> new RentalItemResponse(
                        i.getEquipment().getId(),
                        i.getEquipment().getName(),
                        i.getQuantity()
                ))
                .toList();

        return new RentalResponse(
                rental.getId(),
                rental.getBookingId(),
                rental.getUserId(),
                rental.getClubId(),
                rental.getStatus(),
                items,
                rental.getCreatedAt(),
                rental.getUpdatedAt()
        );
    }

    public List<RentalResponse> findByUserId(Long userId) {
        return rentalRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<Map<String, Object>> getMostRentedEquipments() {
        List<Object[]> results = rentalRepository.findMostRentedEquipments();
        return results.stream()
                .limit(5)
                .map(row -> Map.of(
                        "equipmentId", row[0],
                        "equipmentName", row[1],
                        "totalRented", row[2]
                ))
                .collect(java.util.stream.Collectors.toList());
    }
}