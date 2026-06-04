# Decomposition: flaky test prevention strategies

## Topic Overview

Flaky tests — tests that pass and fail without code changes — are the number one threat to test suite trust and CI reliability. In Laravel applications, common flakiness sources include time-dependent assertions, random test data, inter-test state leakage, network-dependent E2E tests, and CSS-selector brittleness in Dusk. Prevention strategies focus on determinism: freezing time, using explicit factory data, isolating test state via `RefreshDatabase`, faking HTTP calls with `Http::fake()`...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
flaky-test-prevention-strategies/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### flaky test prevention strategies
- **Purpose:** Flaky tests — tests that pass and fail without code changes — are the number one threat to test suite trust and CI reliability. In Laravel applications, common flakiness sources include time-dependent assertions, random test data, inter-test state leakage, network-dependent E2E tests, and CSS-selector brittleness in Dusk. Prevention strategies focus on determinism: freezing time, using explicit factory data, isolating test state via `RefreshDatabase`, faking HTTP calls with `Http::fake()`...
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: PHPUnit/Pest fundamentals, Test isolation concepts, Dusk browser testing, **Related Topics**: Test organization patterns, Time manipulation, HTTP client faking, Dusk waiting strategies, **Advanced Follow-up**: Flaky test detection algorithms, Test retry infrastructure, and Deterministic testing methodology

## Dependency Graph
**Depends on:** **Prerequisites**: PHPUnit/Pest fundamentals, Test isolation concepts, Dusk browser testing, **Related Topics**: Test organization patterns, Time manipulation, HTTP client faking, Dusk waiting strategies, **Advanced Follow-up**: Flaky test detection algorithms, Test retry infrastructure, and Deterministic testing methodology
**Depended on by:** Knowledge units that leverage or extend flaky test prevention strategies patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for flaky test prevention strategies.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization