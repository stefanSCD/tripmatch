package ro.stefanscd.tripmatch.profile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.stefanscd.tripmatch.profile.entity.Profile;

import java.util.List;
import java.util.Optional;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByAccountId(Long accountId);

    List<Profile> findAllByAccountIdIn(List<Long> ids);
}
