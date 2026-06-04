# Decomposition: Amazon SQS Visibility Timeout, FIFO vs Standard

## Topic Overview

Amazon SQS is a fully managed queue service with two queue types: **Standard** (at-least-once, high throughput, no ordering) and **FIFO** (exactly-once, ordered, limited throughput). The **visibility timeout** is the mechanism that prevents multiple consumers from processing the same message — when a worker polls a message, it becomes invisible to other workers for the timeout duration.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k039-amazon-sqs-visibility-timeout/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Amazon SQS Visibility Timeout, FIFO vs Standard
- **Purpose:** Amazon SQS is a fully managed queue service with two queue types: **Standard** (at-least-once, high throughput, no ordering) and **FIFO** (exactly-once, ordered, limited throughput). The **visibility timeout** is the mechanism that prevents multiple consumers from processing the same message — when a worker polls a message, it becomes invisible to other workers for the timeout duration.
- **Difficulty:** Advanced
- **Dependencies:** - K002 Queue Driver Architecture (SQS as a driver)

## Dependency Graph

This KU depends on: - K002 Queue Driver Architecture (SQS as a driver)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Standard queue**: At-least-once delivery. Messages may be delivered more than once (network issues, timeouts). No ordering guarantee. Unlimited throughput. - **FIFO queue**: First-In-First-Out wit...
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