# Decomposition: Silenced Jobs and Silenced Tags

## Topic Overview

Horizon's silencing feature hides specific jobs or tagged jobs from the dashboard's "completed" and "failed" lists, reducing noise from expected, high-frequency jobs (health checks, scheduled maintenance tasks). Jobs are silenced by implementing the `ShouldBeSilenced` interface or by configuring silenced tags in `config/horizon.php`.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k046-silenced-jobs-tags/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Silenced Jobs and Silenced Tags
- **Purpose:** Horizon's silencing feature hides specific jobs or tagged jobs from the dashboard's "completed" and "failed" lists, reducing noise from expected, high-frequency jobs (health checks, scheduled maintenance tasks). Jobs are silenced by implementing the `ShouldBeSilenced` interface or by configuring silenced tags in `config/horizon.php`.
- **Difficulty:** Intermediate
- **Dependencies:** - K045 Job Tags (tag mechanism)

## Dependency Graph

This KU depends on: - K045 Job Tags (tag mechanism)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`ShouldBeSilenced` interface**: Marker interface on a job class. The job processes normally but is not displayed in Horizon's recent job lists. - **Silenced tags**: Configure `horizon.silenced` ar...
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