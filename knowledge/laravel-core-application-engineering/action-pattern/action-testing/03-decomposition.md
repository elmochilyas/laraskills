# Decomposition: Action Testing

## Topic Overview
Testing strategies for action classes — pure unit tests with mocked dependencies, hybrid database tests, orchestration verification, queued action fakes, and business rule assertions.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
action-testing/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Action Testing
- **Purpose:** Testing strategies for action classes — pure unit tests, hybrid database tests, orchestration verification, and queued action fakes.
- **Difficulty:** Intermediate
- **Dependencies:** Action Class Design, PHPUnit/Pest

## Dependency Graph
This KU depends on: Action Class Design, PHPUnit/Pest. It depends on and complements controller-testing and middleware-testing.

## Boundary Analysis
**In scope:** Action as testable unit, unit vs hybrid vs integration test levels, pure unit test pattern, hybrid database test pattern, orchestration verification pattern, queued action test pattern (QueueableActionFake), business rule test pattern, mock vs real dependency decision, test naming conventions, CI pipeline placement.

**Out of scope:** Controller HTTP testing (controller-testing KU), middleware testing (middleware-testing KU), service layer testing (service-layer-pattern domain), general PHPUnit/Pest patterns.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization