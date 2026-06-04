# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Documentation
**Knowledge Unit:** SDK Generation from OpenAPI
**Generated:** 2026-06-03

---

# Decision Inventory

* Codegen tool selection (OpenAPI Generator vs Fern vs Speakeasy)
* SDK versioning strategy (aligned with API vs independent)

---

# Architecture-Level Decision Trees

---

## Codegen Tool Selection — OpenAPI Generator vs Fern vs Speakeasy

---

## Decision Context

Which SDK generation tool should be used? Arises when building a client SDK pipeline from an OpenAPI spec.

---

## Decision Criteria

* language coverage — which languages the API consumers use
* generated code quality — type safety, idiomatic patterns
* CI integration — ease of automation in deployment pipeline
* SDK publishing — support for publishing to package registries

---

## Decision Tree

How many languages must the SDK support?
↓
1-3 mainstream languages (TypeScript, Python, PHP)?
YES → Fern (excellent DX, TypeScript-first, fast generation)
NO → 5+ languages including niche ones?
    YES → OpenAPI Generator (broadest coverage, 50+ languages)
    NO → Speakeasy (SDK publishing pipeline, good middle ground)

---

## Recommended Default

**Default:** Fern for TypeScript-first teams; OpenAPI Generator for broad language support
**Reason:** Fern provides the best developer experience for modern languages; OpenAPI Generator offers the broadest language coverage.

---

## Risks Of Wrong Choice

OpenAPI Generator for small team: verbose config, slower generation. Fern for niche language: unsupported target.

---

## SDK Versioning Strategy — Aligned with API vs Independent

---

## Decision Context

Should SDK versions match API versions exactly, or follow independent versioning? Arises when managing SDK releases.

---

## Decision Tree

Does the API follow semantic versioning for its own releases?
↓
YES → Align SDK version with API version (v2.1.0 API → v2.1.0 SDK)
NO → Independent SDK versioning (SDK consumers may not correlate with API versions)

---

## Recommended Default

**Default:** Align SDK version with API semantic version
**Reason:** Consumers can easily identify which SDK version matches which API version.

---

## Risks Of Wrong Choice

Independent versions: confusion matching SDK to API version, support overhead.

---

*Related rules and skills are not available for this KU (no 05-rules.md or 06-skills.md files).*
