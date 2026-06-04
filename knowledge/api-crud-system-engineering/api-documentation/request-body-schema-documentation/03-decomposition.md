# Decomposition: Request Body Schema Documentation

## Topic Overview
Documenting the structure, constraints, types, and examples of data that clients send to API endpoints. Covers schema definition, rule-to-schema mapping, nested objects, and validation alignment.

## Decomposition Strategy
This KU is atomic — it covers the single concept of describing request payloads. While it relates to response schemas and error schemas, each is a separate KU with distinct focus and mechanics.

## Proposed Folder Structure
```
request-body-schema-documentation/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Request Body Schema Documentation
- **Purpose:** Define how request payloads are documented in OpenAPI schemas
- **Difficulty:** Intermediate
- **Dependencies:** JSON Schema Basics, Laravel Form Request Design

## Dependency Graph
Depends on: JSON Schema Basics, Laravel Form Request Design. Consumed by: Endpoint Documentation Content. Related to: Response Schema Documentation (mirror concept), Error Response Documentation (validation error shapes).

## Boundary Analysis
**In scope:** Request body schema components, JSON Schema constraints (minLength, maxLength, pattern, enum, format), required fields, nullable fields, nested object schemas, array schemas, examples, default values, Scramble's Form Request → schema translation, Scribe's @bodyParam mapping, reusable vs inline schemas, polymorphic request bodies (oneOf/anyOf), schema validation in CI.
**Out of scope:** Response schema documentation (response-schema-documentation KU), error response shapes (error-response-documentation KU), authentication documentation (authentication-documentation KU), Form Request design patterns (input-validation-architecture subdomain).

## Future Expansion Opportunities
- Rule Coverage Matrix — Exhaustive mapping of Laravel validation rules to OpenAPI schema keywords
- Conditional Validation Documentation — Documenting schemas for endpoints with conditional rules
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization