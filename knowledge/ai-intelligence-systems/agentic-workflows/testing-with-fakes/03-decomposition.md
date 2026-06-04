# Decomposition: Testing with Fakes

## Topic Overview
The Laravel AI SDK provides a comprehensive testing layer via `FakeAi` and `AgentFake` classes. `Ai::fake()` intercepts all AI calls and returns pre-defined responses, while `preventStrayPrompts()` asserts that no real API calls leak during tests. This enables deterministic, fast, cost-free testing of AI-powered features without mocking HTTP clients or using real provider credentials.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-06-testing-with-fakes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Testing with Fakes
- **Purpose:** The Laravel AI SDK provides a comprehensive testing layer via `FakeAi` and `AgentFake` classes. `Ai::fake()` intercepts all AI calls and returns pre-defined responses, while `preventStrayPrompts()` asserts that no real API calls leak during tests. This enables deterministic, fast, cost-free testing of AI-powered features without mocking HTTP clients or using real provider credentials.
- **Difficulty:** Intermediate
- **Dependencies:** KU-001, KU-011, KU-005

## Dependency Graph
**Depends on:**
- KU-001
- KU-011
- KU-005

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Ai::fake()
- Ai::fake([$responses])
- AgentFake
- preventStrayPrompts()
- Ai::assertPromptSent()
- Ai::assertNothingPrompted()

**Out of scope:**
- KU-001 topics covered in their respective KUs
- KU-011 topics covered in their respective KUs
- KU-005 topics covered in their respective KUs

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