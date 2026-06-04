# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 04-resilience
**Knowledge Unit:** fuse-circuit-breaker
**Generated:** 2026-06-03

---

# Decision Inventory

1. Circuit Breaker Threshold Configuration
2. Half-Open Probe Strategy
3. State Transition Monitoring Strategy

---

# Architecture-Level Decision Trees

---

## Circuit Breaker Threshold Configuration

---

## Decision Context

Setting failure threshold and cooldown period for the circuit breaker.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Is the upstream service critical with strong SLAs?
↓
YES → Conservative thresholds: 10 failures in 60s window
  ↓
  Does the service have occasional but brief outages?
  ↓
  YES → Longer cooldown (60s) to avoid flapping between states
  NO → Standard cooldown (30s) for typical recovery time
NO → Is the upstream service less reliable but non-critical?
  ↓
  YES → Aggressive thresholds: 3 failures in 30s, quick cooldown
  NO → Standard thresholds: 5 failures in 60s, 30s cooldown
  ↓
  Minimum requests before evaluating failure rate?
  ↓
  YES → Set min_requests = 5 to prevent false trips on small samples
  NO → First few failures trip breaker; unnecessary circuit opens

---

## Rationale

Conservative thresholds prevent false trips on critical services. Aggressive thresholds protect resources from unreliable services. Minimum requests prevent premature tripping on single failures.

---

## Recommended Default

**Default:** 5 failures in 60s window, 30s cooldown, 5 minimum requests
**Reason:** Balanced protection; prevents false trips; adequate recovery window

---

## Risks Of Wrong Choice

Too-low threshold causes flapping on transient blips. Too-high threshold allows cascading failures before breaker opens. No minimum requests trips on single failures.

---

## Related Rules

Use Sliding Window Failure Counting, Set Conservative Thresholds Initially

---

## Related Skills

Implement Retry and Circuit Breaker

---

## Half-Open Probe Strategy

---

## Decision Context

Configuring how the circuit breaker tests for upstream recovery.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Has the cooldown period elapsed?
↓
YES → Transition to Half-Open state; allow single probe request
  ↓
  Did the probe request succeed?
  ↓
  YES → Transition to Closed; reset failure count; resume normal traffic
  NO → Return to Open; restart cooldown period
NO → Stay in Open state; reject all requests
  ↓
  Need to prevent thundering herd on half-open probes?
  ↓
  YES → Use Cache::lock() to ensure only one probe passes
  NO → Multiple simultaneous probes create load spikes on recovery
  ↓
  Need probe request to be lighter than normal request?
  ↓
  YES → Use health check endpoint instead of full operation
  NO → Full operation as probe; tests complete recovery

---

## Rationale

Half-open state allows a single probe to test recovery. Lock-protected probes prevent thundering herd on recovery. Lightweight health check probes are safer than full operations.

---

## Recommended Default

**Default:** Single lock-protected probe using health check endpoint after cooldown
**Reason:** Safe recovery testing; prevents load spikes; lightweight probing

---

## Risks Of Wrong Choice

No lock protection causes multiple simultaneous probes on recovery. Full operation as probe may trigger side effects or cause failures. No half-open requires manual circuit reset.

---

## Related Rules

Implement Half-Open with Probe Requests, Log Every State Transition

---

## Related Skills

Implement Retry and Circuit Breaker

---

## State Transition Monitoring Strategy

---

## Decision Context

Monitoring circuit breaker state transitions for operational awareness.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Are circuit breaker state transitions logged?
↓
YES → Log each transition with timestamp, service, and reason
  ↓
  Need real-time alerting on transitions?
  ↓
  YES → Fire events on Closed→Open transitions for immediate alert
  NO → Log-based monitoring; periodic review of transition logs
NO → Is there a dashboard showing circuit state per service?
  ↓
  YES → Expose transition history and current state in dashboard
  NO → Add dashboard for operational visibility
  ↓
  Need to alert on prolonged open state?
  ↓
  YES → Alert if circuit stays open for >30 minutes (incident trigger)
  NO → Monitor only; no alerting on duration

---

## Rationale

State transition events enable real-time alerting on circuit breaker state changes. Prolonged open state indicates an incident requiring investigation. Dashboard provides current state visibility.

---

## Recommended Default

**Default:** Log all transitions; alert on Closed→Open; dashboard with current state
**Reason:** Full visibility with immediate alerting on degradation events

---

## Risks Of Wrong Choice

No monitoring means circuit transitions are invisible to ops. No prolonged-open alert allows degraded services to stay open indefinitely. No dashboard requires digging through logs for state.

---

## Related Rules
Log Every State Transition for Monitoring, Expose Circuit State Metrics for Alerting

---

## Related Skills
Implement Retry and Circuit Breaker
