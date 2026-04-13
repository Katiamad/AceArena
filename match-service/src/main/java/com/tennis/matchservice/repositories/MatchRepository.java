package com.tennis.matchservice.repositories;

import com.tennis.matchservice.entities.Match;
import com.tennis.matchservice.entities.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByStatus(MatchStatus status); // pour lister les matchs OPEN

    boolean existsByBookingIdAndOwnerUserId(Long bookingId, Long ownerUserId);

    Optional<Match> findByBookingId(Long bookingId);
    @Query("SELECT DISTINCT m FROM Match m LEFT JOIN FETCH m.participants WHERE m.status = :status")
    List<Match> findByStatusWithParticipants(@Param("status") MatchStatus status);

    @Query("SELECT DISTINCT m FROM Match m LEFT JOIN FETCH m.participants WHERE m.id IN :ids")
    List<Match> findByIdsWithParticipants(@Param("ids") List<Long> ids);

    boolean existsByBookingId(Long bookingId);
}
