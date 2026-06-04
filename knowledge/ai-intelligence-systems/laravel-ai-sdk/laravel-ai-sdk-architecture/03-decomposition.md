# Decomposition: Laravel AI SDK Architecture

## Topic Overview
The Laravel AI SDK (`laravel/ai`) is a first-party, MIT-licensed package providing a unified provider-agnostic API across 14 AI providers. Released February 2026 (beta), production-stable March 2026 with Laravel 13. It uses Prism PHP under the hood as a lower-level abstraction but adds Laravel-native conventions: Artisan generators, Facade integration, config files, migration publishing, and a full test-faking layer. The SDK eliminates Python sidecars for most PHP AI use cases.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-01-laravel-ai-sdk-architecture/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel AI SDK Architecture
- **Purpose:** The Laravel AI SDK (`laravel/ai`) is a first-party, MIT-licensed package providing a unified provider-agnostic API across 14 AI providers. Released February 2026 (beta), production-stable March 2026 with Laravel 13. It uses Prism PHP under the hood as a lower-level abstraction but adds Laravel-native conventions: Artisan generators, Facade integration, config files, migration publishing, and a full test-faking layer. The SDK eliminates Python sidecars for most PHP AI use cases.
- **Difficulty:** Intermediate
- **Dependencies:** KU-002, KU-006, KU-007, KU-011, KU-016

## Dependency Graph
**Depends on:**
- KU-002
- KU-006
- KU-007
- KU-011
- KU-016

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Agent
- Promptable
- HasTools
- HasStructuredOutput
- RemembersConversations
- #[Provider]

**Out of scope:**
- KU-002 topics covered in their respective KUs
- KU-006 topics covered in their respective KUs
- KU-007 topics covered in their respective KUs
- KU-011 topics covered in their respective KUs
- KU-016 topics covered in their respective KUs

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