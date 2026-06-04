# Decomposition: Kernel Architecture

## Topic Overview
Laravel has HTTP and Console kernels that orchestrate the request lifecycle, middleware pipeline, and bootstrap sequence for HTTP and CLI entry points respectively.

## Decomposition Strategy
This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
`
kernel-architecture/
  +-- 02-knowledge-unit.md
  +-- 03-decomposition.md
`

## Knowledge Unit Inventory

### Kernel Architecture
- **Purpose:** HTTP and Console kernel lifecycle, middleware pipeline construction, and bootstrap orchestration.
- **Difficulty:** Advanced
- **Dependencies:** Application Class, Bootstrapping Lifecycle

## Dependency Graph
This KU depends on: Application Class, Bootstrapping Lifecycle. It serves as prerequisite for Maintenance Mode and Middleware lifecycle.

## Boundary Analysis
**In scope:** HTTP Kernel lifecycle (index.php to response); Console Kernel lifecycle (command resolution); middleware pipeline construction; Laravel 10- Kernel class vs Laravel 11+ fluent API; middleware registration patterns; priority configuration.
**Out of scope:** Service provider boot details; individual middleware implementation; bootstrapper step internals.

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