package com.tennis.equipmentservice.repository;

import com.tennis.equipmentservice.entity.EquipmentWaitlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface EquipmentWaitlistRepository extends JpaRepository<EquipmentWaitlist, Long> {
    List<EquipmentWaitlist> findByEquipmentId(Long equipmentId);
    boolean existsByEquipmentIdAndUserId(Long equipmentId, Long userId);

    @Transactional
    void deleteByEquipmentId(Long equipmentId);
}