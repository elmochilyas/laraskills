# Decomposition: Module vs. microservice: definition and key differences

## Topic Overview

A module is a logical boundary within a single deployment; a microservice is a network boundary across separate deployments. Both isolate business domains, but modules communicate via in-process method calls, while microservices communicate via network calls (HTTP, message queues).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
MMD-01-module-vs-microservice/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Module vs. microservice: definition and key differences
- **Purpose:** A module is a logical boundary within a single deployment; a microservice is a network boundary across separate deployments. Both isolate business domains, but modules communicate via in-process method calls, while microservices communicate via network calls (HTTP, message queues).
- **Difficulty:** Foundation
- **Dependencies:** COS-06 Domain-based org

## Dependency Graph

This KU depends on: COS-06 Domain-based org
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Module:** A self-contained group of code within a monolith that owns a specific business domain. Modules share a database (potentially schema-separated), process space, and deployment unit. Communic...
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