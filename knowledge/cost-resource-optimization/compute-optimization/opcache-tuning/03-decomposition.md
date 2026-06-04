# Decomposition: OPcache Tuning

## Topic Overview
OPcache stores compiled PHP scripts in shared memory, eliminating the need to parse and compile PHP files on every request. For Laravel, which loads hundreds of files per request (framework + vendor + app code), OPcache is the single most impactful performance optimization. Proper tuning reduces CPU usage by 50-70% and enables servers to handle 2-3x more requests with the same compute resources, directly reducing server count and cost.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-04-opcache-tuning/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### OPcache Tuning
- **Purpose:** OPcache stores compiled PHP scripts in shared memory, eliminating the need to parse and compile PHP files on every request. For Laravel, which loads hundreds of files per request (framework + vendor + app code), OPcache is the single most impactful performance optimization. Proper tuning reduces CPU usage by 50-70% and enables servers to handle 2-3x more requests with the same compute resources, directly reducing server count and cost.
- **Difficulty:** Foundation
- **Dependencies:** - PHP-FPM Tuning (ku-03), - Octane Resource Usage (ku-05), - Performance vs Cost (ku-12)

## Dependency Graph
**Depends on:**
- PHP-FPM Tuning (ku-03)
- Octane Resource Usage (ku-05)
- Performance vs Cost (ku-12)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Standard OPcache: Always enabled in production for every Laravel deployment
- JIT: CPU-bound Laravel workloads (PDF generation, image processing, complex calculations)
- High memory_consumption: Large Laravel apps with many packages (300+ files)
- validate_timestamps = false: Production deployments where files don't change between deploys
- CLI cache: For long-running queue workers (opcache.enable_cli = 1 for workers)
**Out of scope:**
- OPcache: Should never be disabled in production
- JIT for I/O-bound: Laravel is primarily I/O-bound (database, cache, HTTP); JIT provides minimal benefit
- validate_timestamps = true in production: Checking file mtime on every request wastes CPU; unnecessary when deploys create new files
- OPcache CLI for short-lived commands: `php artisan tinker` or one-off commands don't benefit from cached compilation
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization