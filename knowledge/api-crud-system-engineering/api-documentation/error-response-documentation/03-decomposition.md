# Decomposition: Error Response Documentation

## Topic Overview
Documenting all error responses an API endpoint can return — status codes, payload shapes, error codes, and scenarios. Covers standardized error schemas, per-endpoint error documentation, and error example strategies.

## Decomposition Strategy
This KU is atomic — it covers the single concept of documenting error responses. Error response shapes themselves are designed in the error-handling-design subdomain; this KU focuses on their documentation.

## Proposed Folder Structure
```
error-response-documentation/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Error Response Documentation
- **Purpose:** Document all error status codes, shapes, and scenarios per endpoint
- **Difficulty:** Intermediate
- **Dependencies:** HTTP Status Code Selection, Laravel Exception Handling

## Dependency Graph
Depends on: HTTP Status Code Selection, Laravel Exception Handling. Related to: Response Schema Documentation (success shapes), Standardized Error Envelope (error shape design). Serves as prerequisite for: Documentation CI Validation (error documentation completeness).

## Boundary Analysis
**In scope:** Error status code categories (400, 401, 403, 404, 409, 422, 429, 500), error response shape documentation, reusable error components in OpenAPI, scenario-based error examples, machine-readable error codes, per-endpoint error documentation, Retry-After header documentation, error documentation completeness in CI validation, Laravel exception-to-response mapping documentation.
**Out of scope:** Error envelope design decisions (error-handling-design subdomain), validation error shape customization (input-validation-architecture subdomain), error monitoring and alerting, error logging context, error code taxonomy design.

## Future Expansion Opportunities
- Error Code Reference Documentation — Standalone reference document for all error codes
- Interactive Error Simulation — Tooling that lets consumers trigger and inspect error responses
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization