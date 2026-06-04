# Decomposition: Few-Shot and Chain-of-Thought Prompting

## Topic Overview
Few-shot prompting provides the LLM with input-output examples to guide response format and reasoning style, while chain-of-thought (CoT) prompting instructs the model to show its step-by-step reasoning process before giving the final answer. Combined, these techniques dramatically improve accuracy on complex tasks (math, logic, multi-step tool use) and are essential for production AI agents that need reliable, auditable reasoning.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-02-few-shot-chain-of-thought/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Few-Shot and Chain-of-Thought Prompting
- **Purpose:** Few-shot prompting provides the LLM with input-output examples to guide response format and reasoning style, while chain-of-thought (CoT) prompting instructs the model to show its step-by-step reasoning process before giving the final answer. Combined, these techniques dramatically improve accuracy on complex tasks (math, logic, multi-step tool use) and are essential for production AI agents that need reliable, auditable reasoning.
- **Difficulty:** Intermediate
- **Dependencies:** KU-001, KU-004, KU-011, KU-005, KU-026

## Dependency Graph
**Depends on:**
- KU-001
- KU-004
- KU-011
- KU-005
- KU-026

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Few-shot examples
- Zero-shot vs. few-shot
- Chain-of-thought (CoT)
- CoT with tool calling
- Structured CoT
- Example selection

**Out of scope:**
- KU-001 topics covered in their respective KUs
- KU-004 topics covered in their respective KUs
- KU-011 topics covered in their respective KUs
- KU-005 topics covered in their respective KUs
- KU-026 topics covered in their respective KUs

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