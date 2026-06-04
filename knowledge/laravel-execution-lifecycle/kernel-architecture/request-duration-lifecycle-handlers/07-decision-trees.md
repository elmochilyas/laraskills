# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Kernel Architecture
**Knowledge Unit:** Request Duration Lifecycle Handlers
**Generated:** 2026-06-03

---

# Decision Inventory

1. Handler Registration: Duration handlers vs middleware vs event listeners
2. Threshold Strategy: Single vs multi-tier thresholds
3. Handler Safety: Heavy vs lightweight handler logic

---

# Architecture-Level Decision Trees

---

## Decision Name: Monitoring Mechanism Selection

---

## Decision Context

Choosing between request duration lifecycle handlers, middleware, event listeners, or external APM for monitoring slow requests.

---

## Decision Criteria

* performance — duration handlers run post-response (no client impact); middleware runs during request
* architectural — handlers are threshold-gated; middleware runs on every request
* security — handlers can't modify response; middleware can
* maintainability — duration handlers require no third-party services

---

## Decision Tree

Does the monitoring need to run post-response (no client impact)?
↓
YES → Use duration lifecycle handlers — `$kernel->whenRequestLifecycleIsLongerThan(threshold, handler)`
NO → Does the monitoring need to run on EVERY request (not just slow ones)?
↓
YES → Use middleware — runs on every request, can access full request context
NO → Does the monitoring need integration with external APM (New Relic, Datadog)?
↓
YES → Use APM-specific package or SDK — purpose-built for distributed tracing
NO → Do you need to modify the response based on duration?
↓
YES → Use middleware — duration handlers cannot modify the response (post-send)
NO → Use duration lifecycle handlers — simplest, most targeted monitoring

---

## Rationale

Duration handlers run in the terminate phase — after the response is sent. They are threshold-gated, meaning zero overhead for requests under the threshold. They are ideal for passive performance monitoring. Middleware is appropriate when monitoring must run on every request or when the response needs modification. External APM is best for distributed tracing across services.

---

## Recommended Default

**Default:** Duration lifecycle handlers for passive monitoring; middleware for active per-request logic.
**Reason:** Duration handlers have zero client impact; middleware is for request-active concerns.

---

## Risks Of Wrong Choice

- Monitoring in middleware: client pays for monitoring overhead on EVERY request — increases response time.
- Duration handler for response modification: handler runs after send — modifications silently ignored.
- No try-catch in handler: uncaught exception crashes the terminate phase (response already sent, but process may crash).

---

## Related Skills

- Implement Request Duration Lifecycle Handlers (06-skills.md)

---

## Decision Name: Threshold Tier Strategy

---

## Decision Context

Choosing between a single threshold and multi-tier thresholds for duration monitoring.

---

## Decision Criteria

* performance — multiple thresholds add O(n) comparison per request; negligible with <10 handlers
* architectural — graduated thresholds give increasing severity awareness
* security — threshold data may expose performance patterns
* maintainability — start high, lower incrementally

---

## Decision Tree

Start with a single threshold at 2000ms
↓
Are you getting too many false positives (normal requests being flagged)?
YES → Raise the threshold to 3000ms or 4000ms — calibrate to your application's normal performance profile
NO → Are you missing requests that are slightly slow but not critical?
↓
YES → Add a second, lower threshold for warnings (e.g., 500ms warning, 2000ms critical)
NO → Is there a severity hierarchy for slow requests?
↓
YES → Add multi-tier thresholds: 500ms → logging, 2000ms → alert, 5000ms → page
NO → Single threshold is sufficient — one threshold, one action

---

## Rationale

Different thresholds serve different purposes: a lower threshold (500ms) captures requests that are mildly slow for trend analysis; a medium threshold (2000ms) is a warning; a high threshold (5000ms+) is a paging event. Starting high and lowering incrementally prevents alert fatigue.

---

## Recommended Default

**Default:** Start with 2000ms single threshold; add lower warning tier only after baseline is established.
**Reason:** Avoid alert fatigue; calibrate thresholds to real traffic before adding tiers.

---

## Risks Of Wrong Choice

- Threshold too low (100ms): every request triggers — handler runs on every request anyway, defeating the purpose.
- Threshold too high (10000ms): misses all but the most extreme slow requests — no visibility into gradual degradation.
- No try-catch: handler exception crashes terminate phase.

---

## Related Skills

- Implement Request Duration Lifecycle Handlers (06-skills.md)
