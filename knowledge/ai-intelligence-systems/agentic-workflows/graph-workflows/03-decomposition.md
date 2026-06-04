# Decomposition: Graph-Based Workflows

## Topic Overview
Graph-based workflow engines (LaraGraph, AgentGraph) extend multi-agent patterns to durable, stateful, multi-step processes with checkpoints, parallel fan-out, loops, and human-in-the-loop approval gates. Unlike simple linear chains, graph workflows support branching, conditional routing, retries, and long-running sessions with persistence. These are the PHP equivalents of LangGraph (Python).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-03-graph-workflows/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Graph-Based Workflows
- **Purpose:** Graph-based workflow engines (LaraGraph, AgentGraph) extend multi-agent patterns to durable, stateful, multi-step processes with checkpoints, parallel fan-out, loops, and human-in-the-loop approval gates. Unlike simple linear chains, graph workflows support branching, conditional routing, retries, and long-running sessions with persistence. These are the PHP equivalents of LangGraph (Python).
- **Difficulty:** Advanced
- **Dependencies:** KU-012, KU-014, KU-015

## Dependency Graph
**Depends on:**
- KU-012
- KU-014
- KU-015

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Graph
- Nodes
- Edges
- State
- Checkpoints
- Human-in-the-loop

**Out of scope:**
- KU-012 topics covered in their respective KUs
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