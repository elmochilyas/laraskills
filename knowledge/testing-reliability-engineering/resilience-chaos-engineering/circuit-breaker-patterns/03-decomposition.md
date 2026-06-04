# Decomposition: circuit breaker patterns

## Topic Overview

Circuit breaker patterns protect Laravel applications from cascading failures when external services or dependencies become unavailable. In Laravel, circuit breakers are implemented primarily via two packages: `laravel-fuse` (for queue job circuits) and `laravel-circuit-breaker` (for general service calls). A circuit breaker monitors failures to an external dependency — after a configurable threshold of failures, it "opens" the circuit, immediately failing subsequent calls without attemptin...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
circuit-breaker-patterns/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### circuit breaker patterns
- **Purpose:** Circuit breaker patterns protect Laravel applications from cascading failures when external services or dependencies become unavailable. In Laravel, circuit breakers are implemented primarily via two packages: `laravel-fuse` (for queue job circuits) and `laravel-circuit-breaker` (for general service calls). A circuit breaker monitors failures to an external dependency — after a configurable threshold of failures, it "opens" the circuit, immediately failing subsequent calls without attemptin...
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Distributed systems fundamentals, External API integration, Queue job management, **Related Topics**: Resilience testing (Laravel Resilience), Chaos engineering (Laravel Bazooka), Retry and backoff strategies, **Advanced Follow-up**: Bulkhead pattern implementation, Advanced circuit breaker metrics, and Multi-layer resilience patterns

## Dependency Graph
**Depends on:** **Prerequisites**: Distributed systems fundamentals, External API integration, Queue job management, **Related Topics**: Resilience testing (Laravel Resilience), Chaos engineering (Laravel Bazooka), Retry and backoff strategies, **Advanced Follow-up**: Bulkhead pattern implementation, Advanced circuit breaker metrics, and Multi-layer resilience patterns
**Depended on by:** Knowledge units that leverage or extend circuit breaker patterns patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for circuit breaker patterns.
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