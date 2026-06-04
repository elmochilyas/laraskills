# Decomposition: System Prompt Design

## Topic Overview
System prompt design is the practice of crafting the initial instruction given to an LLM that defines its persona, behavior boundaries, output format, and operational rules. In the Laravel AI SDK, the system prompt is set via the `instructions()` method on Agent classes or the `$system` parameter on `Ai::call()`. Well-designed system prompts are the single highest-leverage activity in AI application quality â€” a good prompt can make a weak model perform well; a bad prompt can break a strong one.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-01-system-prompt-design/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### System Prompt Design
- **Purpose:** System prompt design is the practice of crafting the initial instruction given to an LLM that defines its persona, behavior boundaries, output format, and operational rules. In the Laravel AI SDK, the system prompt is set via the `instructions()` method on Agent classes or the `$system` parameter on `Ai::call()`. Well-designed system prompts are the single highest-leverage activity in AI application quality â€” a good prompt can make a weak model perform well; a bad prompt can break a strong one.
- **Difficulty:** Intermediate
- **Dependencies:** KU-002, KU-003, KU-004, KU-005, KU-001

## Dependency Graph
**Depends on:**
- KU-002
- KU-003
- KU-004
- KU-005
- KU-001

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- System prompt vs. user prompt
- Persona definition
- Behavioral guardrails
- Output structure specification
- Context window management
- Chain-of-thought triggers

**Out of scope:**
- KU-002 topics covered in their respective KUs
- KU-003 topics covered in their respective KUs
- KU-004 topics covered in their respective KUs
- KU-005 topics covered in their respective KUs
- KU-001 topics covered in their respective KUs

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