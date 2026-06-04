# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Eloquent ORM / Query Builder
**Knowledge Unit:** 2-30 Strict Mode
**Generated:** 2026-06-03

---

# Decision Inventory

* Enable vs disable strict mode per environment
* Throw vs log for missing/discarded attributes
* Global vs selective enforcement

---

# Architecture-Level Decision Trees

---

## Strict Mode Configuration

---

## Decision Context

Choosing when and how to enable Eloquent strict mode guardrails that prevent silent data loss and debugging frustration.

---

## Decision Criteria

* performance: negligible overhead (checks on attribute access/write)
* architectural: environment-dependent behavior
* maintainability: catches bugs early in development
* security: prevents silent mass-assignment of unintended attributes

---

## Decision Tree

Configuring Eloquent strict mode?
↓
Is this a development, staging, or CI environment?
YES → Enable throwing behavior
    ↓
    Model::preventSilentlyDiscardingAttributes()
    → Throw exception when mass-assignment discards unfillable attributes
    Model::preventAccessingMissingAttributes()
    → Throw exception when accessing non-existent attributes
    Enable BOTH
NO → Is this production?
    YES → Set up logging instead of throwing
        ↓
        Model::preventSilentlyDiscardingAttributes(false)
        Model::preventAccessingMissingAttributes(false)
        Model::handleMissingAttributeAccessUsing(fn($m, $key) => Log::warning(...))
        → Catch issues without breaking the user experience
    NO → Disable (legacy or package compatibility issues)
        → Test carefully — hidden bugs may surface

---

## Rationale

Strict mode catches silent failures: mass-assigning a misspelled attribute silently drops it, and accessing a missing attribute silently returns null. Both cause bugs that are hard to trace. Enabling throwing in dev/staging surfaces these immediately. Logging in production catches issues without downtime.

---

## Recommended Default

**Default:** Enable throwing in non-production, logging in production
**Reason:** Catches bugs early without production risk. The logging handler provides visibility into issues that slip through.

---

## Risks Of Wrong Choice

* Not enabling in development: silent data loss from misspelled attributes goes unnoticed
* Enabling throw mode in production: user-facing 500 errors for missing attributes
* Not configuring the logging handler in production: production bugs are invisible

---

## Related Rules

* Always enable strict mode in non-production environments
* Never throw exceptions in production — use the logging handler instead

---

## Related Skills

* Configure strict mode for development safety
