# Decomposition: Laravel Pulse SlowJobs Recorder

## Topic Overview

The Laravel Pulse `SlowJobs` recorder captures and surfaces jobs that exceed a configurable execution duration threshold. It monitors all dispatched jobs through Pulse's event-driven ingestion pipeline, recording job class, queue name, connection, duration, and execution time.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k070-pulse-slow-jobs-recorder/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Laravel Pulse SlowJobs Recorder
- **Purpose:** The Laravel Pulse `SlowJobs` recorder captures and surfaces jobs that exceed a configurable execution duration threshold. It monitors all dispatched jobs through Pulse's event-driven ingestion pipeline, recording job class, queue name, connection, duration, and execution time.
- **Difficulty:** Intermediate
- **Dependencies:** - K071 Horizon Wait Time Monitoring (complementary observability dimension)

## Dependency Graph

This KU depends on: - K071 Horizon Wait Time Monitoring (complementary observability dimension)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Slow job threshold**: A configurable duration (default: 1000ms) in the Pulse configuration. Any job taking longer than this is recorded as slow. - **Ingestion pipeline**: Pulse records data throug...
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