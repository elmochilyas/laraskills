# Decomposition: Command bus patterns in PHP/Laravel context

## Topic Overview

Command bus dispatches command objects to their handlers, optionally through middleware pipelines. In Laravel, both the built-in Bus facade and queue system implement command bus patterns.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
command-bus-patterns/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Command bus patterns in PHP/Laravel context
- **Purpose:** Command bus dispatches command objects to their handlers, optionally through middleware pipelines. In Laravel, both the built-in Bus facade and queue system implement command bus patterns.
- **Difficulty:** Intermediate
- **Dependencies:** Command pattern, Message queuing |

## Dependency Graph

This KU depends on: Command pattern, Message queuing |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Command: immutable DTO carrying data for an operation - Handler: class that receives command and performs operation - Bus: dispatcher that routes command to handler
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent design patterns covered in related KUs.

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