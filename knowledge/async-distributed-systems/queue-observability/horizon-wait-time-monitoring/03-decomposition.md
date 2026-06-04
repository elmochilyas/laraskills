# Decomposition: Horizon Wait Time Monitoring and Alerts

## Topic Overview

Horizon wait time is the duration a job spends in the queue before a worker starts processing it. This metric — available through Horizon's metrics dashboard and its underlying Redis data — is the single most important indicator of queue health.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k071-horizon-wait-time-monitoring/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Horizon Wait Time Monitoring and Alerts
- **Purpose:** Horizon wait time is the duration a job spends in the queue before a worker starts processing it. This metric — available through Horizon's metrics dashboard and its underlying Redis data — is the single most important indicator of queue health.
- **Difficulty:** Intermediate
- **Dependencies:** - K070 Pulse SlowJobs Recorder (job execution duration observability)

## Dependency Graph

This KU depends on: - K070 Pulse SlowJobs Recorder (job execution duration observability)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Wait time**: Wall-clock time between when a job is pushed to Redis and when it is popped by a worker for processing. This excludes job execution time. - **Queue depth vs. wait time**: Depth counts...
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