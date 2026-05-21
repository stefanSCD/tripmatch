package ro.stefanscd.tripmatch.account.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.admin.dto.AdminAccountListItemResponse;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByEmail(String email);
    @Query("select a from Account a join fetch a.role where a.email = :email")
    Optional<Account> findByEmailWithRole(@Param("email") String email);
    boolean existsByEmail(String email);
    List<Account> findByIsApprovedFalseAndRole_Name(String roleName);
    List<Account> findAllByIdIn(List<Long> ids);
    @Query("""
        select new ro.stefanscd.tripmatch.admin.dto.AdminAccountListItemResponse(
            a.id,
            a.email,
            r.name,
            a.isActive,
            a.isApproved,
            p.firstName,
            p.lastName,
            p.agencyName,
            a.createdAt,
            a.lastLoginAt
        )
        from Account a
        join a.role r
        left join Profile p on p.account.id = a.id
        where (:isActive is null or a.isActive = :isActive)
          and (:role is null or upper(r.name) = :role)
    """)
    Page<AdminAccountListItemResponse> findAdminAccounts(
            @Param("isActive") Boolean isActive,
            @Param("role") String role,
            Pageable pageable
    );

    @Query("""
        select new ro.stefanscd.tripmatch.admin.dto.AdminAccountListItemResponse(
            a.id,
            a.email,
            r.name,
            a.isActive,
            a.isApproved,
            p.firstName,
            p.lastName,
            p.agencyName,
            a.createdAt,
            a.lastLoginAt
        )
        from Account a
        join a.role r
        left join Profile p on p.account.id = a.id
        where (:isActive is null or a.isActive = :isActive)
          and (:role is null or upper(r.name) = :role)
          and (
              lower(a.email) like lower(concat('%', :q, '%'))
              or lower(coalesce(p.firstName, '')) like lower(concat('%', :q, '%'))
              or lower(coalesce(p.lastName, '')) like lower(concat('%', :q, '%'))
              or lower(coalesce(p.agencyName, '')) like lower(concat('%', :q, '%'))
          )
    """)
    Page<AdminAccountListItemResponse> searchAdminAccounts(
            @Param("isActive") Boolean isActive,
            @Param("role") String role,
            @Param("q") String q,
            Pageable pageable
    );
}
