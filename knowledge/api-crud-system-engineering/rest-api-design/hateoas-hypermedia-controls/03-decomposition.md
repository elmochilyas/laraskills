# Decomposition: HATEOAS / Hypermedia Controls

## Topic Overview
Hypermedia links embedded in API responses that guide clients through available state transitions, including self links, pagination links, state-driven links, and hypermedia formats (HAL, JSON:API).

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single constraint with clear implementation patterns and practical tradeoffs. No further decomposition is needed.

## Proposed Folder Structure
```
hateoas-hypermedia-controls/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### HATEOAS / Hypermedia Controls
- **Purpose:** Implement hypermedia-driven API responses with actionable links
- **Difficulty:** Advanced
- **Dependencies:** REST Architectural Constraints, URL Structure Design

## Dependency Graph
This KU depends on: REST Architectural Constraints, URL Structure Design. It serves as prerequisite for REST Maturity Model (Level 3), API Documentation Generation.

## Boundary Analysis
**In scope:** HATEOAS constraint definition, link object structure, hypermedia formats (HAL, JSON:API, Siren), state-driven links, pagination links, Laravel resource link implementation, conditional link generation.
**Out of scope:** Content negotiation format selection (content-negotiation KU), pagination metadata beyond links (pagination-strategies KU), authorization logic (api-authentication-authorization KU).

## Future Expansion Opportunities
None identified — HATEOAS is well-bounded with clear implementation patterns.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization