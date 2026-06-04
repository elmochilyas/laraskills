# Decomposition: Horizon Notifications (Wait Time, Failure Thresholds)

## Topic Overview

Horizon can send notifications when queue wait times exceed thresholds or when long-running jobs are detected. Using Laravel's notification system, Horizon integrates with Slack, email, SMS, and other channels.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k048-horizon-notifications/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Horizon Notifications (Wait Time, Failure Thresholds)
- **Purpose:** Horizon can send notifications when queue wait times exceed thresholds or when long-running jobs are detected. Using Laravel's notification system, Horizon integrates with Slack, email, SMS, and other channels.
- **Difficulty:** Intermediate
- **Dependencies:** - K047 Horizon Metrics (source data for notifications)

## Dependency Graph

This KU depends on: - K047 Horizon Metrics (source data for notifications)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`waits` configuration**: Array of queue-name → seconds mapping. When wait time exceeds this threshold, a notification is sent. - **`horizon.notifications`**: Configuration array in `config/horiz...
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