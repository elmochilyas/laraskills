# Decomposition: `make:job-middleware` Artisan Command

## Topic Overview

`php artisan make:job-middleware` (Laravel 11+) generates a custom job middleware class stub in `app/Queue/Middleware/`. The generated class includes the `handle($job, $next)` method with the standard pipeline pattern.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k090-make-job-middleware-command/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `make:job-middleware` Artisan Command
- **Purpose:** `php artisan make:job-middleware` (Laravel 11+) generates a custom job middleware class stub in `app/Queue/Middleware/`. The generated class includes the `handle($job, $next)` method with the standard pipeline pattern.
- **Difficulty:** Foundation
- **Dependencies:** - K054 Custom Job Middleware Creation (full creation guide)

## Dependency Graph

This KU depends on: - K054 Custom Job Middleware Creation (full creation guide)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Namespace**: Generated in `App\Queue\Middleware\{MiddlewareName}`. - **Stub content**: A class implementing the pipeline pattern with `handle($job, $next)`. - **Usage**: Return an instance from th...
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