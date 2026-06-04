# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 02-saloonphp
**Knowledge Unit:** sdk-auto-generation
**Generated:** 2026-06-03

---

# Decision Inventory

1. Generator Tool Selection
2. SDK Packaging and Integration Strategy
3. Regeneration Workflow Strategy

---

# Architecture-Level Decision Trees

---

## Generator Tool Selection

---

## Decision Context

Choosing the right SDK generator for producing SaloonPHP client libraries from OpenAPI specs.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Is the target framework Laravel/SaloonPHP specifically?
↓
YES → Does Speakeasy support the required OpenAPI version (3.1)?
  ↓
  YES → Use Speakeasy (best Laravel ecosystem support, Saloon output)
  NO → Is the spec simple (<50 endpoints) with standard REST patterns?
    ↓
    YES → Use OpenAPI Generator with custom Saloon template
    NO → Use Fern for custom generator support
NO → Are SDKs needed for multiple languages (PHP + TS + Python)?
  ↓
  YES → Use Speakeasy (multi-language output from one spec)
  NO → Use OpenAPI Generator for single-language, community-maintained output
  ↓
  Need full control over generated code templates?
  ↓
  YES → Use OpenAPI Generator with custom Mustache templates
  NO → Speakeasy opinionated output is sufficient

---

## Rationale

Speakeasy offers the best Laravel/Saloon integration with active maintenance and Saloon output format. OpenAPI Generator provides template customizability at the cost of more setup. Fern fills gaps where neither supports specific output patterns.

---

## Recommended Default

**Default:** Speakeasy for SaloonPHP-targeted generation
**Reason:** Best community support for Laravel ecosystem, produces idiomatic Saloon connectors

---

## Risks Of Wrong Choice

Wrong generator produces non-idiomatic SDK code that fights the framework. Template-based generators without maintenance produce broken output on spec changes.

---

## Related Rules

Use Verified Specs as SDK Generation Source Only, Pin Generator Versions in CI

---

## Related Skills

Automate SaloonPHP SDK Regeneration on API Spec Changes

---

## SDK Packaging and Integration Strategy

---

## Decision Context

Determining how to structure generated SDK code within the Laravel application.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Is the SDK consumed by a single application only?
↓
YES → Is the SDK large (>50 endpoints)?
  ↓
  YES → Separate Composer package with own repository
  NO → Subdirectory in app with service layer wrapping
NO → Will multiple applications consume this SDK?
  ↓
  YES → Separate package with independent versioning and SemVer
  NO → Is the SDK expected to change frequently?
    ↓
    YES → Separate package for independent release cycle
    NO → In-app service layer wrapping is sufficient
  ↓
  Need to decouple SDK updates from application deploys?
  ↓
  YES → Package with private Packagist or Satis
  NO → Git submodule or path repository

---

## Rationale

Separate packages enable independent SDK versioning, allowing consumers to update on their schedule. In-app placement is simpler but couples SDK updates to application deploys.

---

## Recommended Default

**Default:** Separate Composer package with Satis for private distribution
**Reason:** Clean decoupling, independent versioning, reuse across projects

---

## Risks Of Wrong Choice

In-app SDK placement causes tight coupling — spec changes force application deploys with no SDK version pinning. Separate package with no CI testing distributes broken SDKs.

---

## Related Rules

Keep Generated SDKs in a Separate Package

---

## Related Skills

Automate SaloonPHP SDK Regeneration on API Spec Changes

---

## Regeneration Workflow Strategy

---

## Decision Context

Establishing how and when to regenerate SDKs when OpenAPI specs change.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the upstream spec change frequently (>1x/month)?
↓
YES → Implement fully automated CI/CD regeneration pipeline
  ↓
  Spec validated against real API responses before generation?
  ↓
  YES → Auto-merge on successful generation + integration tests
  NO → Generate in CI but require manual PR review before merge
NO → Is the spec stable (quarterly or yearly changes)?
  ↓
  YES → Manual regeneration on spec change with PR review
  NO → On-demand regeneration triggered by developers
  ↓
  Need to support multiple spec versions simultaneously?
  ↓
  YES → Version-pinned generation per API version with separate SDK branches
  NO → Single spec generation targeting latest stable version

---

## Rationale

Frequently changing specs need automation to keep SDK in sync. Stable specs benefit from human review to catch breaking changes before they reach consumers.

---

## Recommended Default

**Default:** CI-triggered generation with PR review for non-trivial spec changes
**Reason:** Balances automation with human oversight for breaking change detection

---

## Risks Of Wrong Choice

Full auto-merge on spec changes silently introduces breaking SDK changes. Manual-only workflow causes SDK drift on rapidly changing specs, creating integration failures.

---

## Related Rules

Pin Generator Versions in CI, Use Verified Specs as SDK Generation Source Only

---

## Related Skills

Automate SaloonPHP SDK Regeneration on API Spec Changes
