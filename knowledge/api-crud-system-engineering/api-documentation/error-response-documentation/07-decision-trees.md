# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Documentation
**Knowledge Unit:** Error Response Documentation
**Generated:** 2026-06-03

---

# Decision Inventory

* Error schema organization (inline vs reusable components)
* Error status code coverage (all vs essential only)

---

# Architecture-Level Decision Trees

---

## Error Schema Organization — Inline vs Reusable Components

---

## Decision Context

Should error response schemas be defined inline per operation or as reusable components with `$ref` references? Arises when documenting error responses in OpenAPI.

---

## Decision Criteria

* consistency — all errors should follow the same structure
* maintainability — schema changes should propagate to all operations
* spec size — inline definitions bloat the spec
* tooling — codegen tools handle `$ref` vs inline differently

---

## Decision Tree

Do all endpoints use the same error response shapes?
↓
YES → Define reusable error components ($ref in components)
NO → Do some endpoints have unique error shapes?
    YES → Base error schema as reusable component + per-endpoint extensions
    NO → Reusable components for all errors

---

## Rationale

Reusable error schemas ensure consistency, reduce spec size, and enable single-point updates. Inline definitions cause drift as different endpoints accidentally diverge.

---

## Recommended Default

**Default:** Reusable error components (`$ref: '#/components/responses/ValidationError'`)
**Reason:** Consistent structure across all endpoints, single source of truth, smaller spec file.

---

## Risks Of Wrong Choice

Inline schemas: duplication, drift, spec bloat, inconsistent error shapes confusing consumers. All errors in one schema: overly generic error model that doesn't capture endpoint-specific details.

---

## Related Rules

N/A

---

## Related Skills

N/A

---

## Error Status Code Coverage — All vs Essential Only

---

## Decision Context

How many error status codes should be documented per endpoint? Arises when deciding the completeness of error documentation.

---

## Decision Criteria

* consumer robustness — ability to write correct error handling
* documentation effort — documenting every error code is time-consuming
* framework behavior — some errors (500, 429) apply to every endpoint
* spec size — each documented error adds spec lines

---

## Decision Tree

Is the endpoint exposed to external developers?
↓
YES → Document ALL possible error status codes (401, 403, 404, 422, 429, 500) with schemas
NO → Internal API with known consumers?
    YES → Document only endpoint-specific errors (skip generic 401/500)
    NO → Document all errors (defensive completeness)

---

## Rationale

Public APIs need comprehensive error documentation — external developers cannot inspect the codebase to discover error shapes. Internal APIs can skip generic errors (401, 500) since consumers have access to the implementation.

---

## Recommended Default

**Default:** Document all error status codes (401, 403, 404, 422, 429, 500) with reusable $ref schemas
**Reason:** Every endpoint can return these errors; reusable schemas minimize effort.

---

## Risks Of Wrong Choice

Only 200 documented: consumers cannot write error handling code, support tickets increase. Every possible error shape documented: excessive spec size for rarely-encountered errors.

---

## Related Rules

N/A

---

## Related Skills

N/A
