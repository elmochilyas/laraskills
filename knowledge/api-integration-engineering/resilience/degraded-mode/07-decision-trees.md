# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 04-resilience
**Knowledge Unit:** degraded-mode
**Generated:** 2026-06-03

---

# Decision Inventory

1. Degraded Mode Trigger Strategy
2. Feature Degradation Strategy (Which Features to Reduce)
3. Recovery Strategy (Automatic vs Manual)

---

# Architecture-Level Decision Trees

---

## Degraded Mode Trigger Strategy

---

## Decision Context

Determining when the system should enter degraded mode.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Is the circuit breaker for the service in Open state?
↓
YES → Enter degraded mode (primary trigger)
  ↓
  Has the circuit been open for >30 minutes?
  ↓
  YES → Escalate to incident management; auto-trigger degraded mode
  NO → Standard degraded mode entry on circuit open
NO → Are rate limit headers indicating near-exhaustion?
  ↓
  YES → Enter degraded mode proactively before rate limit is hit
  NO → Are timeout rates exceeding threshold (>10% of requests)?
    ↓
    YES → Enter degraded mode; timeouts indicate upstream degradation
    NO → Normal operation; no degraded mode needed
  ↓
  Need manual override for degraded mode?
  ↓
  YES → Feature flag or Artisan command for manual degraded mode toggle
  NO → Automatic triggers only; manual override adds complexity

---

## Rationale

Circuit breaker Open state is the primary degraded mode trigger. Proactive triggers (rate limit headroom, timeout rates) can enter degraded mode before circuit opens, providing earlier protection.

---

## Recommended Default

**Default:** Circuit breaker open → enter degraded mode; manual toggle for ops team override
**Reason:** Automatic on clear signal; manual for preemptive or emergency activation

---

## Risks Of Wrong Choice

Single-failure triggers cause flapping in/out of degraded mode. Manual-only entry delays protection until operator notices. No exit strategy keeps system degraded indefinitely.

---

## Related Rules

Implement Automatic Entry and Exit from Degraded Mode

---

## Related Skills

Implement Retry and Circuit Breaker

---

## Feature Degradation Strategy

---

## Decision Context

Choosing which features to disable or reduce in degraded mode.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the feature depend on the degraded upstream service?
↓
YES → Disable or replace with fallback (cached data, defaults)
  ↓
  Is the feature critical (payment processing)?
  ↓
  YES → Serve stale cached data if available; block writes to degraded service
  NO → Show unavailable message or hide the feature entirely
NO → Does the feature depend on other services that are healthy?
  ↓
  YES → Keep feature fully functional; isolate from degraded service
  NO → Feature may also need degradation if it uses shared resources
  ↓
  Need to communicate degraded state to users?
  ↓
  YES → Show status banner or badge on affected features
  NO → Silent degradation: serve fallback without user notification

---

## Rationale

Critical features should degrade gracefully (stale data) rather than fail. Non-critical features can be disabled. User communication prevents confusion about incomplete data.

---

## Recommended Default

**Default:** Critical features use cached fallback; non-critical features disabled with user-visible banner
**Reason:** Maintains core functionality; prevents confusion; clear user communication

---

## Risks Of Wrong Choice

Degrading critical features causes business impact. Not degrading non-critical features wastes resources on known-failing operations. Silent degradation confuses users about data accuracy.

---

## Related Rules

Define Which Features Degrade and Which Remain Critical

---

## Related Skills

Implement Retry and Circuit Breaker

---

## Recovery Strategy

---

## Decision Context

Determining how and when to exit degraded mode.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Has the circuit breaker transitioned to Half-Open?
↓
YES → Allow limited probe requests; monitor for success
  ↓
  Have probes succeeded consecutively (>3)?
  ↓
  YES → Exit degraded mode; transition to normal operation
  NO → Stay in degraded mode; continue half-open probing
NO → Is the upstream health check passing again?
  ↓
  YES → Exit degraded mode after N consecutive health check passes
  NO → Stay degraded; health check still failing
  ↓
  Need cooldown before retrying full traffic?
  ↓
  YES → Gradually increase traffic to recovered service (10% → 50% → 100%)
  NO → Full traffic immediately on recovery

---

## Rationale

Half-open probes test recovery before exiting degraded mode. Consecutive successes prevent flapping. Gradual traffic increase protects a recently recovered service from sudden load.

---

## Recommended Default

**Default:** Exit degraded mode after 3 consecutive half-open probe successes; full traffic immediately
**Reason:** Prevents flapping; simple recovery; adequate protection for most services

---

## Risks Of Wrong Choice

Exiting on single success causes flapping (open→degraded→normal→open). No probe testing allows full traffic to a still-unhealthy service. Gradual ramp adds complexity without benefit for most services.

---

## Related Rules

Consecutive Successes Needed Before Exiting Degraded Mode

---

## Related Skills

Implement Retry and Circuit Breaker
