# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 05-api-versioning
**Knowledge Unit:** openapi-generation
**Generated:** 2026-06-03

---

# Decision Inventory

1. Documentation Strategy (Annotations vs Attributes vs YAML)
2. Spec Generation Tool Selection
3. Spec Validation and CI Strategy

---

# Architecture-Level Decision Trees

---

## Documentation Strategy

---

## Decision Context

Choosing the method for documenting API endpoints in OpenAPI format.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Is the project using PHP 8.0+?
↓
YES → Use PHP 8 attributes for endpoint documentation
  ↓
  Need reusable documentation across endpoints?
  ↓
  YES → Define custom attribute classes for common patterns
  NO → Use built-in OpenAPI attributes (OA\Schema, OA\Property)
NO → Is the project on PHP 7.x?
  ↓
  YES → Use annotation-based documentation in docblocks
  NO → Maintain separate OpenAPI YAML/JSON files manually
  ↓
  Need to generate spec automatically or maintain manually?
  ↓
  YES → Code-based attributes/annotations (auto-generate)
  NO → Manual YAML files (full control, higher maintenance)

---

## Rationale

PHP 8 attributes provide native, typed documentation co-located with code. Annotations are the PHP 7 fallback. Manual YAML gives full control but requires separate maintenance.

---

## Recommended Default

**Default:** PHP 8 OpenAPI attributes on controllers and DTOs
**Reason:** Co-located with code; auto-generatable; version-controllable

---

## Risks Of Wrong Choice

Manual YAML drifts from implementation without CI validation. Annotations are verbose and less discoverable than attributes.

---

## Related Rules
Use PHP 8 Attributes for Controller Documentation, Include Example Values

---

## Related Skills

Implement SaloonPHP Pagination Plugin

---

## Spec Generation Tool Selection

---

## Decision Context

Choosing the tool for generating OpenAPI specs from Laravel code.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Is the team familiar with Swagger/OpenAPI tooling?
↓
YES → Use darkaonline/l5-swagger (most popular Laravel package)
  ↓
  Need spec generation from PHP 8 attributes?
  ↓
  YES → l5-swagger supports attributes; use with OA annotations
  NO → Use scrutinizer/eye for annotation-only projects
NO → Does the project need lightweight spec generation?
  ↓
  YES → Use scrutinizer/eye (simpler, fewer dependencies)
  NO → Use l5-swagger for full Swagger UI + spec generation
  ↓
  Need interactive API explorer (Swagger UI)?
  ↓
  YES → l5-swagger includes built-in Swagger UI
  NO → scrutinizer/eye is lighter without UI

---

## Rationale

l5-swagger is the most widely used Laravel OpenAPI package with Swagger UI included. scrutinizer/eye is a lighter alternative for teams that only need the spec file.

---

## Recommended Default

**Default:** darkaonline/l5-swagger for PHP 8 attribute-based spec generation
**Reason:** Most adopted; includes Swagger UI; supports attributes; active maintenance

---

## Risks Of Wrong Choice

Overly heavy tooling for simple APIs adds unnecessary dependencies. Too-light tooling misses features needed for spec validation and UI.

---

## Related Rules
Define Reusable Schemas for DTOs, Version the OpenAPI Spec Alongside the API

---

## Related Skills

Implement SaloonPHP Pagination Plugin

---

## Spec Validation and CI Strategy

---

## Decision Context

Automating spec validation in the development pipeline.

---

## Decision Criteria

* maintainability
* reliability

---

## Decision Tree

Is the spec generated automatically from code?
↓
YES → Validate generated spec against OpenAPI schema in CI
  ↓
  Does the spec need to match the actual API behavior?
  ↓
  YES → Add contract testing (verify responses match spec) in CI
  NO → Schema validation only; no behavioral testing
NO → Is the spec maintained manually (YAML files)?
  ↓
  YES → Validate manually against schema + contract tests for accuracy
  NO → Spec generation from code is strongly recommended
  ↓
  Need to detect breaking spec changes?
  ↓
  YES → Add OpenAPI diff tool in CI to compare old vs new spec
  NO → Manual review only; no automated breaking change detection

---

## Rationale

Generated specs should be validated for schema correctness. Contract tests ensure the implementation matches the spec. Spec diff detects breaking changes before deployment.

---

## Recommended Default

**Default:** Validate spec against OpenAPI schema + contract tests in CI
**Reason:** Schema correctness + behavioral accuracy; prevents spec-implementation drift

---

## Risks Of Wrong Choice

No validation allows malformed specs to reach consumers. No contract tests allow implementation to drift from spec. No diff allows accidental breaking changes.

---

## Related Rules
Validate Generated Spec Against OpenAPI Schema, Integrate Spec Generation into CI Pipeline

---

## Related Skills

Implement SaloonPHP Pagination Plugin
