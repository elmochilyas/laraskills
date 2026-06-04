# Decomposition: Mock and Fake HTTP Client for Testing

## Topic Overview
Mock and fake HTTP clients enable deterministic testing of API integration code without real network calls. Laravel's Http::fake() intercepts requests at the Guzzle middleware level, returning predefined responses based on URL patterns. SaloonPHP extends this with MockClient for connector-level mocking, request recording, and fixture replay.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
`
03-decomposition.md/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### Mock and Fake HTTP Client for Testing
- **Purpose:** Mock and fake HTTP clients enable deterministic testing of API integration code without real network calls. Laravel's Http::fake() intercepts requests at the Guzzle middleware level, returning predefined responses based on URL patterns. SaloonPHP extends this with MockClient for connector-level mocking, request recording, and fixture replay.
- **Difficulty:** 
- **Dependencies:** 

## Dependency Graph
**Depends on:**
- 


**Depended by:**
Referenced by downstream Knowledge Units in this domain.

## Boundary Analysis
**In scope:**
- Core concepts and implementation patterns
- Laravel ecosystem integration patterns
- Production deployment considerations

**Out of scope:**
- Topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

? No Knowledge Unit is overloaded

? No major concept is missing

? Boundaries are clear

? Future phases can operate on individual units

? The structure can scale without reorganization