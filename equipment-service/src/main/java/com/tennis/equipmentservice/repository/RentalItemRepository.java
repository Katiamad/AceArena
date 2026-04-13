package com.tennis.equipmentservice.repository;

import com.tennis.equipmentservice.entity.RentalItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RentalItemRepository extends JpaRepository<RentalItem, Long> {
}
