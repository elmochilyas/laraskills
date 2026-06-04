# Metadata

**Domain:** api-integration-engineering
**Subdomain:** api-versioning
**Knowledge Unit:** openapi-generation
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] CI pipeline validates spec on PR
- [ ] PHP 8 attributes used for endpoint documentation
- [ ] Reusable schemas defined for DTOs
- [ ] Define Reusable Schemas for DTOs
- [ ] Include Example Values in All Schema Definitions
- [ ] Integrate Spec Generation into CI Pipeline
- [ ] Use PHP 8 Attributes for Endpoint Documentation
- [ ] Validate Generated Spec Against OpenAPI Schema
- [ ] Attributes/annotations added to all versioned endpoints
- [ ] Docs accessible at `/api/documentation`
- [ ] Endpoints grouped by version via tags
- [ ] Add `#[OA\Info]`, `#[OA\Schema]`, `#[OA\Get]`, etc. attributes or annotations
- [ ] Document version-specific request/response schemas per version
- [ ] Generate per-version specs for separate consumption

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add `#[OA\Info]`, `#[OA\Schema]`, `#[OA\Get]`, etc. attributes or annotations
- [ ] Document version-specific request/response schemas per version
- [ ] Generate per-version specs for separate consumption
- [ ] Generate spec: `php artisan l5-swagger:generate`
- [ ] Install OpenAPI generation package
- [ ] Serve docs at `/api/documentation` with version selector
- [ ] Use `@OA\Tag` to group endpoints by version
- [ ] Validate generated spec with swagger-validator
- [ ] Define Reusable Schemas for DTOs
- [ ] Include Example Values in All Schema Definitions
- [ ] Integrate Spec Generation into CI Pipeline
- [ ] Use PHP 8 Attributes for Endpoint Documentation

---

# Performance Checklist

- [ ] CI spec validation adds ~1s to pipeline
- [ ] Generated spec file caching eliminates runtime overhead
- [ ] Spec generation adds ~100-500ms during generation (not per-request)
- [ ] Swagger UI asset loading ~5-10ms per page load

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Hardcoded example values not matching production data shapes
- [ ] Missing error response schemas (incomplete spec)
- [ ] Not versioning the spec separately
- [ ] Outdated spec not matching actual API behavior
- [ ] Spec generation dependency on production database data

---

# Testing Checklist

- [ ] Attributes/annotations added to all versioned endpoints
- [ ] CI pipeline validates spec on PR
- [ ] Docs accessible at `/api/documentation`
- [ ] Endpoints grouped by version via tags
- [ ] OpenAPI package installed
- [ ] PHP 8 attributes used for endpoint documentation
- [ ] Request/response schemas documented per version
- [ ] Reusable schemas defined for DTOs
- [ ] Spec generates without errors
- [ ] Spec validated against OpenAPI schema

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [[Outdated Spec Not Matching Actual API](#1-outdated-spec-not-matching-actual-api)]
- [ ] [[Missing Error Response Schemas](#2-missing-error-response-schemas)]
- [ ] [[Hardcoded Example Values Not Matching Production](#3-hardcoded-example-values-not-matching-production)]
- [ ] [[Not Versioning the Spec Separately](#4-not-versioning-the-spec-separately)]
- [ ] [[Spec Generation Dependent on Production Data](#5-spec-generation-dependent-on-production-data)]

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


