# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Retry & Failure Handling
**Knowledge Unit:** K018 — Backoff Strategies
**Generated:** 2026-06-03

---

# Decision Inventory

* Fixed vs Exponential Backoff Selection
* Jitter: Add vs Don't Add

---

# Architecture-Level Decision Trees

---

## Fixed vs Exponential Backoff Selection

---

### Decision Context

Whether to use a fixed delay (single integer) or exponential array for backoff between retries.

---

### Decision Criteria

* Downstream service sensitivity to request bursts
* Number of retries configured
* Time-to-recovery requirements
* API rate limit characteristics

---

### Decision Tree

Calling external API with rate limits?
YES → Use exponential backoff array — progressive delays respect rate limits
NO → Calling internal infrastructure (DB, cache)?
    YES → Fixed backoff acceptable — predictable timing matters
NO → 3+ retries configured?
    YES → Exponential array — early retries are quick, later ones are longer
NO → 1-2 retries only?
    YES → Fixed backoff is sufficient — single or dual delay
NO → No backoff configured (default)?
    YES → Always set explicit backoff — default is immediate retry loop

---

### Rationale

Exponential backoff gives progressively longer delays: [10, 30, 120] waits 10s, then 30s, then 120s. This gives quick recovery for transient issues while backing off for persistent problems. Fixed backoff is simpler but doesn't distinguish between early and late retries.

---

### Recommended Default

**Default:** Use exponential backoff array with length matching `$tries - 1` for external API calls; fixed backoff for internal infrastructure
**Reason:** Exponential backoff is the industry standard for external services. Fixed backoff is simpler for internal calls where timing predictability matters.

---

### Risks Of Wrong Choice

- No backoff: immediate retry loop burns CPU with no recovery window
- Fixed for external APIs: considered aggressive, may trigger abuse protections
- Array shorter than tries-1: last value reused for remaining retries — may be too short

---

### Related Rules

- match-array-length-to-tries-minus-one
- use-exponential-plus-jitter-for-external-apis

---

### Related Skills

- Configure Backoff Strategies

---

## Jitter: Add vs Don't Add

---

### Decision Context

Whether to add random variance (jitter) to backoff delays to prevent thundering herd on recovery.

---

### Decision Criteria

* Worker count that may retry simultaneously
* Downstream service recovery window
* Synchronized retry risk

---

### Decision Tree

Multiple workers may retry the same failed service at the same time?
YES → Add jitter — prevents thundering herd
NO → Single worker processing these jobs?
    YES → Jitter unnecessary — no synchronization risk
NO → Service is known to handle burst recovery gracefully?
    YES → Jitter optional — service has rate limiting built-in
NO → Default safe approach?
    YES → Add jitter — negligible cost, prevents herd behavior

---

### Rationale

Without jitter, all workers retry at the same time after the backoff delay expires. When a downstream service recovers, all waiting jobs retry simultaneously — potentially overwhelming the just-recovered service. Jitter spreads retries across the recovery window.

---

### Recommended Default

**Default:** Add jitter to all exponential backoff strategies for external API calls
**Reason:** Negligible CPU cost, prevents thundering herd on service recovery, and aligns with industry best practices.

---

### Risks Of Wrong Choice

- No jitter with multi-worker: synchronized retry flood on recovery
- Jitter with single worker: unnecessary complexity but harmless
- No jitter and no backoff: 100% CPU burn until service recovers

---

### Related Rules

- use-exponential-plus-jitter-for-external-apis
- match-array-length-to-tries-minus-one

---

### Related Skills

- Configure Backoff Strategies
