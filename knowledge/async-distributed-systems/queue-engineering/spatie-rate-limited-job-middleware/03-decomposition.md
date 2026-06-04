# Decomposition: Spatie `laravel-rate-limited-job-middleware` Package

## Topic Overview

Spatie's `laravel-rate-limited-job-middleware` package provides an alternative to Laravel's built-in `RateLimited` middleware with additional features: explicit configuration per job (intervals, strategy, release behavior), conditional application (control which job instances are rate-limited), and a cleaner API for defining rate limit schedules. It uses the same `RateLimiter` facade under the hood but offers more developer-friendly configuration.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k053-spatie-rate-limited-job-middleware/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Spatie `laravel-rate-limited-job-middleware` Package
- **Purpose:** Spatie's `laravel-rate-limited-job-middleware` package provides an alternative to Laravel's built-in `RateLimited` middleware with additional features: explicit configuration per job (intervals, strategy, release behavior), conditional application (control which job instances are rate-limited), and a cleaner API for defining rate limit schedules. It uses the same `RateLimiter` facade under the hood but offers more developer-friendly configuration.
- **Difficulty:** Advanced
- **Dependencies:** - K050 `RateLimited` Job Middleware (Laravel built-in)

## Dependency Graph

This KU depends on: - K050 `RateLimited` Job Middleware (Laravel built-in)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **RateLimited middleware (Spatie)**: Configurable per job via `middleware()` method with `RateLimited::allowed()` or `RateLimited::times()`. - **`allowed()`**: Define allowed calls per time period: ...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent queue/event patterns covered in related KUs.

## Future Expansion Opportunities

None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization