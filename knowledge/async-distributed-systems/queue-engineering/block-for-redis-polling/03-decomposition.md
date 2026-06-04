# Decomposition: `block_for` Redis Option for Worker Polling

## Topic Overview

The `block_for` configuration option in the Redis queue connection controls how long the worker's `BRPOP` call blocks waiting for a job. Without it (or set to `null`), the worker polls Redis in a tight loop — every iteration executes `BRPOP` with a 0-second timeout, which returns immediately if no job is available, then sleeps for `--sleep` seconds.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k080-block-for-redis-polling/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `block_for` Redis Option for Worker Polling
- **Purpose:** The `block_for` configuration option in the Redis queue connection controls how long the worker's `BRPOP` call blocks waiting for a job. Without it (or set to `null`), the worker polls Redis in a tight loop — every iteration executes `BRPOP` with a 0-second timeout, which returns immediately if no job is available, then sleeps for `--sleep` seconds.
- **Difficulty:** Advanced
- **Dependencies:** - K002 Queue Driver Architecture (Redis driver context)

## Dependency Graph

This KU depends on: - K002 Queue Driver Architecture (Redis driver context)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`BRPOP`**: Redis blocking list pop command. Takes a timeout in seconds. Returns an element immediately if available, otherwise blocks until an element arrives or the timeout expires. - **Polling b...
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