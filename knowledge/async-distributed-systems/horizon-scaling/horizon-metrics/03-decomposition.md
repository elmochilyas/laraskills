# Decomposition: Horizon Metrics (Throughput, Runtime, Wait Time)

## Topic Overview

Horizon collects and displays three core metrics per queue: **throughput** (jobs processed per minute), **runtime** (average job execution time in milliseconds), and **wait time** (estimated seconds before a newly queued job will be processed). These metrics are stored in Redis as snapshots with configurable retention.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k047-horizon-metrics/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Horizon Metrics (Throughput, Runtime, Wait Time)
- **Purpose:** Horizon collects and displays three core metrics per queue: **throughput** (jobs processed per minute), **runtime** (average job execution time in milliseconds), and **wait time** (estimated seconds before a newly queued job will be processed). These metrics are stored in Redis as snapshots with configurable retention.
- **Difficulty:** Advanced
- **Dependencies:** - K048 Horizon Notifications (metrics-based alerts)

## Dependency Graph

This KU depends on: - K048 Horizon Notifications (metrics-based alerts)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Throughput**: Number of jobs completed per minute for a given queue. Rolling window. - **Runtime**: Average time from job start to job completion (or failure). Includes middleware time. - **Wait t...
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