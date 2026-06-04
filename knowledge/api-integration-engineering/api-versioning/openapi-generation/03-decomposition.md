# Decomposition: OpenAPI/Swagger Documentation Generation from Laravel

## Topic Overview
OpenAPI (formerly Swagger) documentation generation from Laravel APIs automates the creation of machine-readable API specifications that drive interactive documentation, client SDK generation, and testing tools. The two primary Laravel packagesâ€”Scribe and l5-swaggerâ€”take different approaches: Scribe extracts documentation from route annotations and PHPDoc blocks with customizable content strategies, while l5-swagger (a DarkaOnile wrapper) generates specs from OpenAPI annotations within controller code. OpenAPI specs enable auto-generated client SDKs via tools like Speakeasy, Postman, and OpenAPI Generator.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k030-openapi-generation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### OpenAPI/Swagger Documentation Generation from Laravel
- **Purpose:** OpenAPI (formerly Swagger) documentation generation from Laravel APIs automates the creation of machine-readable API specifications that drive interactive documentation, client SDK generation, and testing tools. The two primary Laravel packagesâ€”Scribe and l5-swaggerâ€”take different approaches: Scribe extracts documentation from route annotations and PHPDoc blocks with customizable content strategies, while l5-swagger (a DarkaOnile wrapper) generates specs from OpenAPI annotations within controller code. OpenAPI specs enable auto-generated client SDKs via tools like Speakeasy, Postman, and OpenAPI Generator.
- **Difficulty:** Intermediate
- **Dependencies:** K009, K038, K023

## Dependency Graph
**Depends on:**
- K009
- K038
- K023

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- OpenAPI Specification
- Scribe
- l5-swagger
- Auto-Generated SDKs
- Interactive Docs
- Versioned Documentation

**Out of scope:**
- K009 topics covered in their respective KUs
- K038 topics covered in their respective KUs
- K023 topics covered in their respective KUs

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