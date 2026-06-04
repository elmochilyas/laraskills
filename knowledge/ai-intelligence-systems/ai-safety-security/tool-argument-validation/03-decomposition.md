# Decomposition: Tool Argument Validation

## Topic Overview
Tool argument validation is the most critical security boundary in agent applications. Since tool arguments come from the LLM (not from user input directly), they can be manipulated via prompt injection to pass unexpected values to PHP methods. Strict schema validation, allowed-values enforcement, and output sanitization are essential to prevent injection attacks through tools.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-04-tool-argument-validation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Tool Argument Validation
- **Purpose:** Tool argument validation is the most critical security boundary in agent applications. Since tool arguments come from the LLM (not from user input directly), they can be manipulated via prompt injection to pass unexpected values to PHP methods. Strict schema validation, allowed-values enforcement, and output sanitization are essential to prevent injection attacks through tools.
- **Difficulty:** Intermediate
- **Dependencies:** KU-006, KU-034, KU-036

## Dependency Graph
**Depends on:**
- KU-006
- KU-034
- KU-036

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Schema-based validation
- Allowed values
- Length limits
- Numeric bounds
- Read-only enforcement
- Scope injection

**Out of scope:**
- KU-006 topics covered in their respective KUs
- KU-034 topics covered in their respective KUs
- KU-036 topics covered in their respective KUs

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