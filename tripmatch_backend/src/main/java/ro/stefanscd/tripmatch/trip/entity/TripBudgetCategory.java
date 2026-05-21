package ro.stefanscd.tripmatch.trip.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "trip_budget_categories")
@NoArgsConstructor
@Getter
@Setter
public class TripBudgetCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_budget_id", nullable = false)
    private TripBudget tripBudget;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private BudgetCategory category;

    @Column(name = "allocated_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal allocatedAmount;

    @Column(name = "spent_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal spentTotal;
}
