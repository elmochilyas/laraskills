# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Documentation
**Knowledge Unit:** Scramble vs Scribe Selection
**Generated:** 2026-06-03

---

# Decision Inventory

* Documentation tool selection (Scramble vs Scribe vs Hybrid)
* Error documentation strategy

---

# Architecture-Level Decision Trees

---

## Documentation Tool Selection — Scramble vs Scribe vs Hybrid

---

## Decision Context

Which OpenAPI documentation generation tool should be used? Arises at the start of every Laravel API project.

---

## Decision Criteria

* PHP version — Scramble requires PHP 8.0+; Scribe works with 7.4+
* type coverage — Scramble needs type-hinted Form Requests and API Resources
* error documentation — Scramble doesn't infer errors; Scribe requires explicit annotations
* output formats — HTML site vs Swagger UI vs Postman collection
* maintenance burden — annotations vs zero-config inference

---

## Decision Tree

Does the project use PHP 8.0+ with type-hinted Form Requests and API Resources?
↓
YES → Is comprehensive error documentation a priority?
    YES → Hybrid: Scramble for schemas + manual error overlay
    NO → Scramble (zero-config, low maintenance)
NO → PHP 7.x or limited type coverage?
    YES → Scribe (PHPDoc annotations, explicit control)
    NO → Evaluate both based on specific requirements

---

## Recommended Default

**Default:** Scramble for well-typed Laravel 11+ APIs; Scribe for APIs needing HTML docs or complex error documentation
**Reason:** Scramble eliminates annotation maintenance. Scribe provides more output formats and error doc control.

---

## Risks Of Wrong Choice

Scramble without error doc plan: consumers have no error documentation. Scribe for rapid iteration: annotation maintenance overhead.

---

## Error Documentation Strategy

---

## Decision Context

How should error responses be documented when using a tool that doesn't infer them? Arises regardless of doc tool choice.

---

## Decision Tree

Does the documentation tool infer error schemas?
↓
YES → Verify inferred errors are complete; manually augment missing ones
NO → Manually define error schemas:
    → Create reusable error components in OpenAPI
    → Apply to all endpoints via `$ref`
    → Use scenarios for different error types

---

## Recommended Default

**Default:** Manual error schema components regardless of auto-generation capability
**Reason:** Error documentation is universally poor in auto-generated tools. Explicit error schemas ensure completeness.

---

## Risks Of Wrong Choice

No error documentation: consumers cannot write robust error handling. Incomplete error docs: consumer code fails on undocumented error paths.

---

*Related rules and skills are not available for this KU (no 05-rules.md or 06-skills.md files).*
