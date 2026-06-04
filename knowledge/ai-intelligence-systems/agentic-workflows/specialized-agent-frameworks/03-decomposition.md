# Decomposition: Specialized Agent Frameworks

## Topic Overview
Beyond the first-party Laravel AI SDK, the PHP ecosystem has specialized agent frameworks that extend agent capabilities. SuperAgent (v0.8.6) is an enterprise multi-agent SDK with team management. LarAgent is a LangChain-inspired agent builder with planning and memory. Conductor focuses on orchestration with middleware pipelines. These fill gaps not yet addressed by the core SDK.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-07-specialized-agent-frameworks/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Specialized Agent Frameworks
- **Purpose:** Beyond the first-party Laravel AI SDK, the PHP ecosystem has specialized agent frameworks that extend agent capabilities. SuperAgent (v0.8.6) is an enterprise multi-agent SDK with team management. LarAgent is a LangChain-inspired agent builder with planning and memory. Conductor focuses on orchestration with middleware pipelines. These fill gaps not yet addressed by the core SDK.
- **Difficulty:** Advanced
- **Dependencies:** KU-011, KU-012, KU-013, KU-014

## Dependency Graph
**Depends on:**
- KU-011
- KU-012
- KU-013
- KU-014

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- SuperAgent
- LarAgent
- Conductor
- AgentGraph

**Out of scope:**
- KU-011 topics covered in their respective KUs
- KU-012 topics covered in their respective KUs
- KU-013 topics covered in their respective KUs
- KU-014 topics covered in their respective KUs

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