# Decomposition: laravel nightwatch

## Topic Overview

Laravel Nightwatch is Laravel's official production Application Performance Monitoring (APM) service, providing real-time and historical performance data for Laravel applications. It captures: request throughput and latency, database query performance, queued job execution, cache operation metrics, HTTP client call timings, and exception tracking. Nightwatch integrates as a Laravel service provider that collects performance data during request execution and reports it to the Nightwatch dashbo...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
laravel-nightwatch/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### laravel nightwatch
- **Purpose:** Laravel Nightwatch is Laravel's official production Application Performance Monitoring (APM) service, providing real-time and historical performance data for Laravel applications. It captures: request throughput and latency, database query performance, queued job execution, cache operation metrics, HTTP client call timings, and exception tracking. Nightwatch integrates as a Laravel service provider that collects performance data during request execution and reports it to the Nightwatch dashbo...
- **Difficulty:** Foundation
- **Dependencies:** laravel-pulse, laravel-telescope, and debugbar-collectors-profiling

## Dependency Graph
**Depends on:** laravel-pulse, laravel-telescope, and debugbar-collectors-profiling
**Depended on by:** Knowledge units that leverage or extend laravel nightwatch patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for laravel nightwatch.
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