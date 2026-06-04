# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Retry & Failure Handling
**Knowledge Unit:** K019 — Progressive Backoff Arrays
**Generated:** 2026-06-03

---

# Decision Inventory

* Exponential Progression Multiplier Selection
* Backoff Array Length vs $tries Alignment

---

# Architecture-Level Decision Trees

---

## Exponential Progression Multiplier Selection

---

### Decision Context

Choosing the multiplier for exponential backoff progression (e.g., [5, 10, 20] vs [10, 30, 90]).

---

### Decision Criteria

* Downstream service recovery time distribution
* Total time to exhaust all retries
* Acceptable delay between retries

---

### Decision Tree

External API with rate limits?
YES → Conservative progression (2x): [10, 20, 40, 80] — respects rate windows
NO → Internal infrastructure failover?
    YES → Moderate progression (3x): [5, 15, 45] — quick recovery, then back off
NO → Need fast retry with short total window?
    YES → Aggressive start, slower progression: [3, 6, 12, 24]
NO → Default?
    YES → Standard 2x progression: [10, 20, 40, 80]

---

### Rationale

The exponential multiplier determines how quickly delays grow. 2x is conservative and standard. Higher multipliers reach long delays faster but skip medium-range delays. The progression should match the downstream service's typical recovery pattern.

---

### Recommended Default

**Default:** 2x exponential progression: `[10, 20, 40, 80]` for 4 retries (5 total attempts)
**Reason:** Standard exponential backoff with balanced progression. 10s first retry is quick; 80s last retry gives significant recovery time.

---

### Risks Of Wrong Choice

- Too aggressive (5x+): long delays reached too quickly — lost recovery opportunity
- Too conservative (1.5x): delays don't grow enough — thundering herd on recovery
- Irregular progression: unpredictable retry timing, hard to debug

---

### Related Rules

- match-array-length-to-tries-minus-one
- use-exponential-plus-jitter-for-external-apis

---

### Related Skills

- Configure Backoff Strategies

---

## Backoff Array Length vs $tries Alignment

---

### Decision Context

Ensuring the backoff array length matches `$tries - 1` (one element per retry).

---

### Decision Criteria

* Number of retries needed
* Array element mapping to attempts
* Default value when array is too short

---

### Decision Tree

Array length == $tries - 1?
YES → Perfect alignment — each retry has its own delay
NO → Array shorter than $tries - 1?
    YES → Last array value reused for remaining retries — may be too short
NO → Array longer than $tries - 1?
    YES → Extra elements ignored — unused configuration

---

### Rationale

Each array element corresponds to one retry attempt. If `$tries = 5`, you have 4 retries — the array should have 4 elements. Missing elements silently reuse the last value. Extra elements are ignored.

---

### Recommended Default

**Default:** Always match backoff array length to `$tries - 1` (one element per retry)
**Reason:** Each retry has its own expected delay. Silent reuse of last value or ignored elements creates confusion.

---

### Risks Of Wrong Choice

- Array too short: last value reused — later retries may have unexpectedly short delay
- Array too long: extra elements never used — misleading configuration
- Single integer for 4 retries: all retries use same delay — not progressive

---

### Related Rules

- match-array-length-to-tries-minus-one
- use-exponential-plus-jitter-for-external-apis

---

### Related Skills

- Configure Backoff Strategies
