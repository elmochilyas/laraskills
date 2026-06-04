# Decomposition: Horizon Supervisor Configuration

## Topic Overview

Horizon supervisors are the core unit of configuration — they define which queues to process, how many worker processes to allocate, balancing strategy, retry/timeout limits, and memory constraints. Unlike raw `queue:work` commands, Horizon supervisors are declared in `config/horizon.php` per environment and managed through Horizon's own process supervisor (the `Horizon::start()` master process).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k041-horizon-supervisor-configuration/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Horizon Supervisor Configuration
- **Purpose:** Horizon supervisors are the core unit of configuration — they define which queues to process, how many worker processes to allocate, balancing strategy, retry/timeout limits, and memory constraints. Unlike raw `queue:work` commands, Horizon supervisors are declared in `config/horizon.php` per environment and managed through Horizon's own process supervisor (the `Horizon::start()` master process).
- **Difficulty:** Advanced
- **Dependencies:** - K042 Auto Balancing with `time` Strategy

## Dependency Graph

This KU depends on: - K042 Auto Balancing with `time` Strategy
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Supervisor definition**: Each supervisor in `config/horizon.php` is an array of configuration with `connection`, `queue`, `balance`, `minProcesses`, `maxProcesses`, `tries`, `timeout`, `memory`, `...
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