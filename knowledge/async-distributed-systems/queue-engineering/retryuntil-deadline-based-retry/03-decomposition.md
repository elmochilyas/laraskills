# Decomposition: retryUntil — Dynamic Deadline-Based Retry

## Topic Overview

`retryUntil()` provides dynamic, deadline-based retry logic for Laravel queue jobs — fundamentally different from the static `$tries` property. It evaluates a closure that returns a `DateTime` or `Carbon` instance, and the job continues retrying as long as the current time is before the deadline. This enables business-aware retry strategies tied to real-world time windows rather than arbitrary attempt counts.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

```
retryuntil-deadline-based-retry/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
  05-rules.md
  06-skills.md
  07-decision-trees.md
  08-anti-patterns.md
  09-checklists.md
```

## Knowledge Unit Inventory

### retryUntil — Dynamic Deadline-Based Retry
- **Purpose:** `retryUntil()` provides dynamic, deadline-based retry logic for Laravel queue jobs. It evaluates a closure that returns a Carbon deadline; the job retries as long as now() < deadline. This is fundamentally different from the static `$tries` property and enables business-aligned retry windows for time-sensitive operations like webhook delivery, payment processing, and SLA-bounded tasks.
- **Difficulty:** Advanced
- **Dependencies:** K046 `$tries` and `$maxExceptions` (contrast), K051 `ThrottlesExceptions` (related)

## Dependency Graph

This KU depends on: K046 `$tries` and `$maxExceptions` (contrast), K051 `ThrottlesExceptions` (related)
This KU is depended on by: Queue job design patterns, Horizon monitoring strategies, webhook retry architectures.

## Boundary Analysis

**In scope:**
- `retryUntil()` method signature and behavior
- Dynamic deadline calculation with Carbon
- Distinction between `retryUntil()`, `$tries`, and `$maxExceptions`
- Combination with `$backoff` strategies
- Use cases: webhook retries, payment retries, SLA-bounded operations
- Testing with time travel (Pest `travelTo()`, Carbon `setTestNow()`)
- Horizon considerations for deadline-based retries
- Clock skew and timezone handling

**Out of scope:** Fixed `$tries` configuration (covered in K046), `ThrottlesExceptions` middleware (K051), `ShouldBeUnique` behavior (K055), general queue worker configuration, Redis/Horizon infrastructure setup.

## Future Expansion Opportunities

None identified — the topic is stable and well-bounded at this granularity.

---

## Success Criteria

This decomposition is complete when:

- [x] No Knowledge Unit is overloaded
- [x] No major concept is missing
- [x] Boundaries are clear
- [x] Future phases can operate on individual units
- [x] The structure can scale without reorganization
