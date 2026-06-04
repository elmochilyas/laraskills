# Decomposition: Agent Architecture Fundamentals

## Topic Overview
Agents in the Laravel AI SDK are PHP classes that encapsulate instructions (system prompt), conversation history, tools, and output schema. The agent class implements contracts to declare capabilities, and the SDK runtime handles LLM interaction, tool dispatch, memory persistence, streaming, and queueing. This is the foundational building block for all AI features.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-01-agent-architecture-fundamentals/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Agent Architecture Fundamentals
- **Purpose:** Agents in the Laravel AI SDK are PHP classes that encapsulate instructions (system prompt), conversation history, tools, and output schema. The agent class implements contracts to declare capabilities, and the SDK runtime handles LLM interaction, tool dispatch, memory persistence, streaming, and queueing. This is the foundational building block for all AI features.
- **Difficulty:** Intermediate
- **Dependencies:** KU-001, KU-005, KU-006, KU-007, KU-012

## Dependency Graph
**Depends on:**
- KU-001
- KU-005
- KU-006
- KU-007
- KU-012

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Agent
- Promptable
- HasTools
- HasStructuredOutput
- Conversational
- RemembersConversations

**Out of scope:**
- KU-001 topics covered in their respective KUs
- KU-005 topics covered in their respective KUs
- KU-006 topics covered in their respective KUs
- KU-007 topics covered in their respective KUs
- KU-012 topics covered in their respective KUs

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