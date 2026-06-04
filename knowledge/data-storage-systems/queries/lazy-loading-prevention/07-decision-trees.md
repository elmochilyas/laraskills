# 2-4 Lazy Loading Prevention - Decision Trees

## Throw vs Log for Lazy Loading Violations

---

## Decision Context

Choosing whether to throw an exception or log a warning when lazy loading is detected in different environments.

---

## Decision Criteria

* performance: prevention adds overhead; logging is cheaper than throwing
* architectural: local dev should catch errors; production should degrade gracefully
* maintainability: CI must fail on violations; production must not crash

---

## Decision Tree

Setting up lazy loading prevention?

↓

What environment?

↓

Local/Staging/CI?

YES → Enable throwing (strict)

    ↓
    `Model::preventLazyLoading(true)`
    
    ↓
    Any lazy-loaded relationship throws LazyLoadingViolationException
    Developer must fix immediately
    CI builds fail on violations

NO → Production?

    YES → Enable logging (not throwing)
    
        ↓
        `Model::preventLazyLoading(false)`
        `Model::handleLazyLoadingViolationUsing(fn($model, $relation) => Log::warning("Lazy loading: $relation on ".get_class($model)))`
        
        ↓
        Application continues working
        Violations logged for investigation
        Some violations may only appear in production with real data volumes

NO → Unknown?

    → Default: throw in non-production, log in production:
    `Model::preventLazyLoading(! app()->isProduction())`

---

## Rationale

Throwing in development forces immediate fixes. Logging in production prevents crashes while providing visibility. CI must throw to prevent N+1 from reaching production. The conditional pattern ensures each environment has appropriate behavior.

---

## Recommended Default

**Default:** `Model::preventLazyLoading(! app()->isProduction())` with production logging
**Reason:** Standard pattern that catches violations in dev/CI while protecting production uptime.

---

## Risks Of Wrong Choice

Never enabling: N+1 bugs reach production silently, cause performance degradation at scale. Always throwing in production: a new code path that lazy-loads will crash the request, causing 500 errors.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Enable Lazy Loading Prevention and Detection
