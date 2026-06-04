# Decomposition: Response Schema Documentation

## Topic Overview
Documenting the structure, types, nesting, and semantics of data returned by API endpoints. Covers single resources, collections, pagination, relationships, and conditional fields.

## Decomposition Strategy
This KU is atomic — it covers the single concept of describing response payloads. While it relates to request schemas, pagination, and error responses, each is a separate KU.

## Proposed Folder Structure
```
response-schema-documentation/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Response Schema Documentation
- **Purpose:** Define how API response payloads are documented in OpenAPI schemas
- **Difficulty:** Intermediate
- **Dependencies:** Laravel API Resources, JSON Schema

## Dependency Graph
Depends on: Laravel API Resources, JSON Schema. Consumed by: Endpoint Documentation Content, SDK Generation from OpenAPI. Related to: Request Body Schema Documentation, Error Response Documentation, Pagination Metadata Design.

## Boundary Analysis
**In scope:** Response schema components (single resource, collection, paginated), property types and formats, nullable fields, read-only properties, relationship inclusion, conditional field documentation, wrapper vs unwrapped response documentation, pagination metadata schemas, Scramble API Resource translation, Scribe @response annotation, response examples per status code, contract testing for schema verification.
**Out of scope:** Request body schemas (request-body-schema-documentation KU), error response shapes (error-response-documentation KU), pagination metadata design decisions (pagination-strategies subdomain), authentication response tokens (authentication-documentation KU).

## Future Expansion Opportunities
- Sparse Fieldset Documentation — Documenting endpoint behavior when fields parameter restricts response properties
- Response Schema for Aggregates — Documenting computed/aggregate response fields
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization