package com.tennis.equipmentservice.repository;

import com.tennis.equipmentservice.entity.Rental;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RentalRepository extends JpaRepository<Rental, Long> {
    List<Rental> findByUserId(Long userId);

    // 👇 Compte les locations par équipement
    @Query("SELECT i.equipment.id, i.equipment.name, SUM(i.quantity) as total " +
            "FROM RentalItem i GROUP BY i.equipment.id, i.equipment.name " +
            "ORDER BY total DESC")
    List<Object[]> findMostRentedEquipments();
}