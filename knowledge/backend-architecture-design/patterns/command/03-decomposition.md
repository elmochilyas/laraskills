# Decomposition: Command pattern in PHP/Laravel context

## Topic Overview

Command encapsulates a request as an object, parameterizing clients with different requests, queuing or logging them, and supporting undoable operations. In Laravel, commands are central: queued jobs implement the command pattern, the Artisan command bus dispatches console commands, and the `Bus` facade provides a command bus for synchronous/asynchronous dispatch.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
command/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Command pattern in PHP/Laravel context
- **Purpose:** Command encapsulates a request as an object, parameterizing clients with different requests, queuing or logging them, and supporting undoable operations. In Laravel, commands are central: queued jobs implement the command pattern, the Artisan command bus dispatches console commands, and the `Bus` facade provides a command bus for synchronous/asynchronous dispatch.
- **Difficulty:** Foundation
- **Dependencies:** Queues, serialization |

## Dependency Graph

This KU depends on: Queues, serialization |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Command: object that encapsulates all information needed to perform an action - Invoker: asks the command to carry out the request - Receiver: knows how to perform the actual work
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