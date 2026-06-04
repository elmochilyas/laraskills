# Decomposition: Scramble vs Scribe Selection

## Topic Overview
Systematic comparison and decision framework for choosing between Scramble (type-inference-based) and Scribe (annotation-based) for Laravel API documentation generation.

## Decomposition Strategy
This KU is atomic � it covers a single decision point with well-bounded comparison criteria. The mechanics of each tool are covered in their respective KUs.

## Proposed Folder Structure
```
scramble-vs-scribe-selection/
  +-- 02-knowledge-unit.md
  +-- 03-decomposition.md
```

## Knowledge Unit Inventory

### Scramble vs Scribe Selection
- **Purpose:** Provide a decision framework for selecting the appropriate documentation generator
- **Difficulty:** Intermediate
- **Dependencies:** Endpoint Documentation Content, OpenAPI Spec Generation

## Dependency Graph
Depends on: Endpoint Documentation Content, OpenAPI Spec Generation. References: Scramble Integration, Scribe Integration. Consumed by: Project Setup/Architecture decisions.

## Boundary Analysis
**In scope:** Tool comparison (inference vs annotation, output formats, PHP requirements, Laravel compatibility), decision factors (type coverage, error documentation needs, output format requirements, maintenance budget, control requirements), decision matrix, migration path between tools, hybrid approaches, team-based selection criteria, generation speed comparison, CI integration differences, documentation hosting differences, consumer experience comparison.
**Out of scope:** Detailed Scramble mechanics (scramble-integration KU), detailed Scribe mechanics (scribe-integration KU), manual OpenAPI spec authoring (openapi-spec-generation KU), Postman collection specifics (postman-collection-generation KU), SDK generation pipeline (sdk-generation-from-openapi KU).

## Future Expansion Opportunities
- Post-Processing Pipeline � Enriching auto-generated specs with manual content regardless of tool
- Documentation Strategy Framework � Broader decision framework including manual specs and external tools
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization