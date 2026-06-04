# Decomposition: Tool Calling

## Topic Overview
Tool calling lets LLMs invoke PHP methods dynamically. The Laravel AI SDK supports this via the `HasTools` interface and `Tool` classes. Tools are PHP classes implementing a `handle()` method and a JSON schema describing their inputs. The LLM decides when to call a tool, the SDK executes it, and the result is returned to the LLM for continued reasoning. This is the foundation for agentic behavior.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-06-tool-calling/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Tool Calling
- **Purpose:** Tool calling lets LLMs invoke PHP methods dynamically. The Laravel AI SDK supports this via the `HasTools` interface and `Tool` classes. Tools are PHP classes implementing a `handle()` method and a JSON schema describing their inputs. The LLM decides when to call a tool, the SDK executes it, and the result is returned to the LLM for continued reasoning. This is the foundation for agentic behavior.
- **Difficulty:** Intermediate
- **Dependencies:** KU-001, KU-005, KU-011, KU-027

## Dependency Graph
**Depends on:**
- KU-001
- KU-005
- KU-011
- KU-027

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Tool
- HasTools
- Tool schema
- Automatic execution
- MaxSteps
- Scoped tools

**Out of scope:**
- KU-001 topics covered in their respective KUs
- KU-005 topics covered in their respective KUs
- KU-011 topics covered in their respective KUs
- KU-027 topics covered in their respective KUs

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