package com.tennis.matchservice.repositories;

import com.tennis.matchservice.entities.MatchParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MatchParticipantRepository extends JpaRepository<MatchParticipant, Long> {

    boolean existsByMatch_IdAndUserId(Long matchId, Long userId);

    long countByMatch_Id(Long matchId);

    Optional<MatchParticipant> findByMatch_IdAndUserId(Long matchId, Long userId);

    List<MatchParticipant> findByUserId(Long userId);

    List<MatchParticipant> findByMatch_Id(Long matchId);

    /** Combien de joueurs ont déjà payé leur part pour ce match */
    long countByMatch_IdAndHasPaidTrue(Long matchId);

    /** Tous les participants d'un match qui n'ont pas encore payé */
    @Query("SELECT p FROM MatchParticipant p WHERE p.match.id = :matchId AND p.hasPaid = false")
    List<MatchParticipant> findUnpaidByMatchId(@Param("matchId") Long matchId);

    /** Tous les matchIds auxquels un user participe (évite LazyInitializationException) */
    @Query("SELECT p.match.id FROM MatchParticipant p WHERE p.userId = :userId")
    List<Long> findMatchIdsByUserId(@Param("userId") Long userId);
}