# Decomposition: Event design patterns

## Topic Overview

Event design determines whether events are easy to evolve, debug, and consume. Three core dimensions: schema design (what data the event carries), granularity (one event per type of occurrence vs.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
CPC-04-event-design/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Event design patterns
- **Purpose:** Event design determines whether events are easy to evolve, debug, and consume. Three core dimensions: schema design (what data the event carries), granularity (one event per type of occurrence vs.
- **Difficulty:** Advanced
- **Dependencies:** CPC-02 Domain events basics

## Dependency Graph

This KU depends on: CPC-02 Domain events basics
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Fat events vs. thin events:** A fat event carries all data the consumer might need (`OrderPlaced` with product names, prices, addresses). A thin event carries only an ID and type. Fat events reduce ...
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