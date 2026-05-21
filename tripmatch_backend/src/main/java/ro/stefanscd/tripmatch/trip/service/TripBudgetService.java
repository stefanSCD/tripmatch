package ro.stefanscd.tripmatch.trip.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.account.repository.AccountRepository;
import ro.stefanscd.tripmatch.common.exception.BadRequestException;
import ro.stefanscd.tripmatch.common.exception.NotFoundException;
import ro.stefanscd.tripmatch.trip.dto.budget.TripBudgetCategoryResponse;
import ro.stefanscd.tripmatch.trip.dto.budget.TripBudgetResponse;
import ro.stefanscd.tripmatch.trip.dto.budget.UpsertTripBudgetCategoryRequest;
import ro.stefanscd.tripmatch.trip.dto.budget.UpsertTripBudgetRequest;
import ro.stefanscd.tripmatch.trip.entity.BudgetCategory;
import ro.stefanscd.tripmatch.trip.entity.Trip;
import ro.stefanscd.tripmatch.trip.entity.TripBudget;
import ro.stefanscd.tripmatch.trip.entity.TripBudgetCategory;
import ro.stefanscd.tripmatch.trip.repository.ActivityCategoryEstimatedTotalProjection;
import ro.stefanscd.tripmatch.trip.repository.ActivityRepository;
import ro.stefanscd.tripmatch.trip.repository.TripBudgetCategoryRepository;
import ro.stefanscd.tripmatch.trip.repository.TripBudgetRepository;
import ro.stefanscd.tripmatch.trip.repository.TripRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class TripBudgetService {
    private final TripBudgetRepository tripBudgetRepository;
    private final TripBudgetCategoryRepository tripBudgetCategoryRepository;
    private final AccountRepository accountRepository;
    private final TripRepository tripRepository;
    private final ActivityRepository activityRepository;

    public TripBudgetService(TripBudgetRepository tripBudgetRepository,
                             TripBudgetCategoryRepository tripBudgetCategoryRepository,
                             AccountRepository accountRepository,
                             TripRepository tripRepository,
                             ActivityRepository activityRepository) {
        this.tripBudgetRepository = tripBudgetRepository;
        this.tripBudgetCategoryRepository = tripBudgetCategoryRepository;
        this.accountRepository = accountRepository;
        this.tripRepository = tripRepository;
        this.activityRepository = activityRepository;
    }

    @Transactional(readOnly = true)
    public TripBudgetResponse getTripBudgetByTrip(Long tripId, String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Account not found!"));

        tripRepository.findTripByIdAndAccountId(tripId, account.getId())
                .orElseThrow(() -> new NotFoundException("Trip not found!"));

        TripBudget tripBudget = tripBudgetRepository.findByTripId(tripId)
                .orElseThrow(() -> new NotFoundException("Budget not found!"));

        BigDecimal estimatedTotal = nz(activityRepository.sumEstimatedCostByTripId(tripId));
        return toTripBudgetResponse(tripBudget, estimatedTotal);
    }

    @Transactional
    public TripBudgetResponse upsertTripBudget(Long tripId, UpsertTripBudgetRequest req, String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Account not found!"));

        Trip trip = tripRepository.findTripByIdAndAccountId(tripId, account.getId())
                .orElseThrow(() -> new NotFoundException("Trip not found!"));

        TripBudget budget = tripBudgetRepository.findByTripId(tripId)
                .orElseGet(() -> {
                    TripBudget b = new TripBudget();
                    b.setTrip(trip);
                    b.setSpentTotal(BigDecimal.ZERO);
                    b.setEstimatedTotal(BigDecimal.ZERO);
                    return b;
                });

        BigDecimal estimated = nz(activityRepository.sumEstimatedCostByTripId(tripId));

        budget.setTotalBudget(scale(req.getTotalBudget()));
        budget.setCurrency(req.getCurrency().trim().toUpperCase());
        budget.setSpentTotal(scale(req.getSpentTotal() != null ? req.getSpentTotal() : nz(budget.getSpentTotal())));
        budget.setEstimatedTotal(scale(estimated));

        tripBudgetRepository.save(budget);

        if (req.getCategories() != null) {
            upsertBudgetCategories(budget, req.getCategories());
        }

        return toTripBudgetResponse(budget, estimated);
    }

    private BigDecimal percent(BigDecimal part, BigDecimal total) {
        if (total == null || total.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;
        return nz(part).multiply(new BigDecimal("100"))
                .divide(total, 2, RoundingMode.HALF_UP);
    }

    private void upsertBudgetCategories(TripBudget budget, List<UpsertTripBudgetCategoryRequest> categoriesRequest) {
        validateNoDuplicateCategory(categoriesRequest);

        List<TripBudgetCategory> existing = tripBudgetCategoryRepository.findByTripBudgetId(budget.getId());
        Map<BudgetCategory, TripBudgetCategory> existingByCategory = existing.stream()
                .collect(java.util.stream.Collectors.toMap(TripBudgetCategory::getCategory, c -> c));

        Set<BudgetCategory> requestedCategories = new HashSet<>();
        List<TripBudgetCategory> toSave = new ArrayList<>();

        for (UpsertTripBudgetCategoryRequest categoryRequest : categoriesRequest) {
            BudgetCategory categoryType = categoryRequest.getCategory();
            requestedCategories.add(categoryType);

            TripBudgetCategory category = existingByCategory.getOrDefault(categoryType, new TripBudgetCategory());
            if (category.getId() == null) {
                category.setTripBudget(budget);
                category.setCategory(categoryType);
                category.setSpentTotal(BigDecimal.ZERO);
            }

            category.setAllocatedAmount(scale(categoryRequest.getAllocatedAmount()));
            category.setSpentTotal(scale(categoryRequest.getSpentTotal() != null
                    ? categoryRequest.getSpentTotal()
                    : nz(category.getSpentTotal())));
            toSave.add(category);
        }

        List<TripBudgetCategory> toDelete = existing.stream()
                .filter(existingCategory -> !requestedCategories.contains(existingCategory.getCategory()))
                .toList();

        if (!toDelete.isEmpty()) {
            tripBudgetCategoryRepository.deleteAll(toDelete);
        }

        if (!toSave.isEmpty()) {
            tripBudgetCategoryRepository.saveAll(toSave);
        }
    }

    private void validateNoDuplicateCategory(List<UpsertTripBudgetCategoryRequest> categoriesRequest) {
        Set<BudgetCategory> seen = new HashSet<>();
        for (UpsertTripBudgetCategoryRequest categoryRequest : categoriesRequest) {
            if (!seen.add(categoryRequest.getCategory())) {
                throw new BadRequestException("Duplicate category in request: " + categoryRequest.getCategory());
            }
        }
    }

    private TripBudgetResponse toTripBudgetResponse(TripBudget budget, BigDecimal estimatedTotalFromActivities) {
        BigDecimal totalBudget = scale(nz(budget.getTotalBudget()));
        BigDecimal estimatedTotal = scale(nz(estimatedTotalFromActivities));
        BigDecimal spentTotal = scale(nz(budget.getSpentTotal()));

        Map<BudgetCategory, BigDecimal> estimatedByCategory = getEstimatedByCategory(budget.getTrip().getId());
        Map<BudgetCategory, TripBudgetCategory> savedCategoriesByType = getSavedCategoriesByType(budget.getId());

        List<TripBudgetCategoryResponse> categoryResponses = new ArrayList<>();
        for (BudgetCategory category : BudgetCategory.values()) {
            TripBudgetCategory savedCategory = savedCategoriesByType.get(category);

            BigDecimal allocated = scale(savedCategory != null ? nz(savedCategory.getAllocatedAmount()) : BigDecimal.ZERO);
            BigDecimal spent = scale(savedCategory != null ? nz(savedCategory.getSpentTotal()) : BigDecimal.ZERO);
            BigDecimal estimatedCategory = scale(estimatedByCategory.getOrDefault(category, BigDecimal.ZERO));

            categoryResponses.add(new TripBudgetCategoryResponse(
                    category,
                    allocated,
                    estimatedCategory,
                    spent,
                    scale(allocated.subtract(estimatedCategory)),
                    scale(allocated.subtract(spent)),
                    percent(estimatedCategory, allocated),
                    percent(spent, allocated)
            ));
        }

        TripBudgetResponse response = new TripBudgetResponse();
        response.setId(budget.getId());
        response.setTripId(budget.getTrip().getId());
        response.setTotalBudget(totalBudget);
        response.setCurrency(budget.getCurrency());
        response.setEstimatedTotal(estimatedTotal);
        response.setSpentTotal(spentTotal);
        response.setRemainingByEstimated(scale(totalBudget.subtract(estimatedTotal)));
        response.setRemainingBySpent(scale(totalBudget.subtract(spentTotal)));
        response.setEstimatedProgressPct(percent(estimatedTotal, totalBudget));
        response.setSpentProgressPct(percent(spentTotal, totalBudget));
        response.setCategories(categoryResponses);

        return response;
    }

    private Map<BudgetCategory, BigDecimal> getEstimatedByCategory(Long tripId) {
        Map<BudgetCategory, BigDecimal> result = new EnumMap<>(BudgetCategory.class);
        for (ActivityCategoryEstimatedTotalProjection row : activityRepository.sumEstimatedCostByTripIdGroupedByCategory(tripId)) {
            result.put(row.getCategory(), scale(nz(row.getEstimatedTotal())));
        }
        return result;
    }

    private Map<BudgetCategory, TripBudgetCategory> getSavedCategoriesByType(Long tripBudgetId) {
        Map<BudgetCategory, TripBudgetCategory> map = new HashMap<>();
        for (TripBudgetCategory category : tripBudgetCategoryRepository.findByTripBudgetId(tripBudgetId)) {
            map.put(category.getCategory(), category);
        }
        return map;
    }

    private BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal scale(BigDecimal value) {
        return nz(value).setScale(2, RoundingMode.HALF_UP);
    }
}
