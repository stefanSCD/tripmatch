package ro.stefanscd.tripmatch.account.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.stefanscd.tripmatch.account.entity.Account;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Account> findByIsApprovedFalseAndRole_Name(String roleName);
    List<Account> findAllByIdIn(List<Long> ids);
}
