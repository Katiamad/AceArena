package com.tennis.equipmentservice.repository;

import com.tennis.equipmentservice.entity.Equipment;
import com.tennis.equipmentservice.entity.EquipmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    // Vérifier doublon nom dans un club
    boolean existsByClubIdAndNameIgnoreCase(Long clubId, String name);

    // Trouver tous les équipements actifs
    List<Equipment> findByStatus(EquipmentStatus status);

    // Trouver par club
    List<Equipment> findByClubId(Long clubId);

    // Trouver actifs par club
    List<Equipment> findByClubIdAndStatus(Long clubId, EquipmentStatus status);

    // Pagination
    Page<Equipment> findByStatus(EquipmentStatus status, Pageable pageable);

    // Equipements disponibles (stock > 0)
    List<Equipment> findByClubIdAndStatusAndStockAvailableGreaterThan(
            Long clubId,
            EquipmentStatus status,
            Integer stock
    );
}
