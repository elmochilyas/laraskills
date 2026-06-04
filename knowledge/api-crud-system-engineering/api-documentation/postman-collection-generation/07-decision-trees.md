# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Documentation
**Knowledge Unit:** Postman Collection Generation
**Generated:** 2026-06-03

---

# Decision Inventory

* Environment vs collection separation strategy
* Collection update strategy (regenerate vs manual enhancement)

---

# Architecture-Level Decision Trees

---

## Environment vs Collection Separation Strategy

---

## Decision Context

Should environment-specific values be included in the collection or stored separately? Arises when generating Postman collections.

---

## Decision Criteria

* reusability — collection should work across dev/staging/production
* security — tokens and URLs must not be hardcoded in shared collections
* consumer experience — minimal setup steps to start using the collection
* maintainability — single collection file vs maintaining environment files

---

## Decision Tree

Is the collection shared across multiple environments (dev, staging, production)?
↓
YES → Separate environment files (collection + environment.json template)
NO → Single-team use with fixed URL?
    YES → Hardcoded values in collection (acceptable for internal-only)
    NO → Always use variables + separate environment

---

## Recommended Default

**Default:** Environment variables in collection + separate environment files per environment
**Reason:** Reusable across deployments, no credentials in shared collection, consumers use environment files.

---

## Risks Of Wrong Choice

Hardcoded values: collection unusable across environments, credentials exposed in version control.

---

## Collection Update Strategy — Regenerate vs Manual Enhancement

---

## Decision Context

Should collections be regenerated from the OpenAPI spec on each change, or manually enhanced with test scripts? Arises when maintaining Postman collections.

---

## Decision Criteria

* accuracy — regeneration ensures spec matches collection
* scripts — manual enhancements like test scripts lost on regeneration
* automation — regeneration is automated; manual enhancement requires effort
* tooling — Scribe generates collection automatically with spec

---

## Decision Tree

Do you have test scripts or pre-request scripts in the collection?
↓
YES → Generate from spec, apply manual enhancements as post-processing scripts
NO → Regenerate collection from spec on every deployment

---

## Recommended Default

**Default:** Regenerate from spec on each deployment; reapply scripts via post-processing
**Reason:** Keeps collection in sync while preserving manual enhancements.

---

## Risks Of Wrong Choice

Manual-only updates: collection drifts from spec. Regeneration overwriting scripts: lost test coverage.

---

*Related rules and skills are not available for this KU (no 05-rules.md or 06-skills.md files).*
