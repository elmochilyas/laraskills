# Decomposition: Distributed tracing across contexts

## Topic Overview

Distributed tracing tracks a request as it crosses bounded contexts, services, and processes. Each request is assigned a correlation ID at entry.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
CPC-11-distributed-tracing/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Distributed tracing across contexts
- **Purpose:** Distributed tracing tracks a request as it crosses bounded contexts, services, and processes. Each request is assigned a correlation ID at entry.
- **Difficulty:** Expert
- **Dependencies:** CPC-04 Event design (correlation/causation IDs)

## Dependency Graph

This KU depends on: CPC-04 Event design (correlation/causation IDs)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Trace:** The entire journey of a request from entry point to completion. A trace is composed of spans. **Span:** A single unit of work within a trace. Each span has a start time, end time, and optio...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent architectural patterns covered in related KUs.

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