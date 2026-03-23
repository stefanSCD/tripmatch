package ro.stefanscd.tripmatch.account.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.stefanscd.tripmatch.account.entity.Role;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
}
