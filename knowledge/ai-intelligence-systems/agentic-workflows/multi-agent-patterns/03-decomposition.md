# Decomposition: Multi-Agent Patterns

## Topic Overview
The Laravel AI SDK ships five multi-agent patterns based on Anthropic research: chaining, routing, parallelization, orchestrator-workers, and sub-agents. These enable complex workflows by composing multiple specialized agents. Each pattern addresses a specific coordination problem, and the SDK provides PHP implementations with tool calling, memory, failover, and queue support.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-02-multi-agent-patterns/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Multi-Agent Patterns
- **Purpose:** The Laravel AI SDK ships five multi-agent patterns based on Anthropic research: chaining, routing, parallelization, orchestrator-workers, and sub-agents. These enable complex workflows by composing multiple specialized agents. Each pattern addresses a specific coordination problem, and the SDK provides PHP implementations with tool calling, memory, failover, and queue support.
- **Difficulty:** Intermediate
- **Dependencies:** KU-011, KU-013, KU-014, KU-015

## Dependency Graph
**Depends on:**
- KU-011
- KU-013
- KU-014
- KU-015

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Chaining
- Routing
- Parallelization
- Orchestrator-Worker
- Sub-agents

**Out of scope:**
- KU-011 topics covered in their respective KUs
- KU-013 topics covered in their respective KUs
- KU-014 topics covered in their respective KUs
- KU-015 topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization