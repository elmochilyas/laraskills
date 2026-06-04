# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Design
**Knowledge Unit:** Strict Mode Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

* Strict mode enablement scope
* Lazy loading prevention configuration
* Silent discarding prevention

---

# Architecture-Level Decision Trees

---

## Strict Mode Enablement Scope

---

## Decision Context

Deciding which environments should have strict mode (`shouldBeStrict()`) enabled.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Is the environment production?
↓
YES → Is the application stable and N+1-free?
    YES → Strict mode optional — consider individual controls for fine-tuning
    NO → Enable strict mode during initial deployment and monitoring phase
NO → Is the environment local, staging, or testing?
    YES → ALWAYS enable `shouldBeStrict()` — catches issues early
    NO → Enable — no reason to disable in development

---

## Recommended Default

**Default:** `shouldBeStrict()` in all non-production environments; production optional after stabilization
**Reason:** Catches N+1, silent discarding, and missing attributes early in development.

---

## Risks Of Wrong Choice

Not enabling strict mode in development allows N+1 queries, silent attribute discarding, and missing attribute bugs to go unnoticed until production.

---

## Related Rules

* Enable shouldBeStrict in AppServiceProvider::boot()

---

## Related Skills

* Configure Strict Mode for Eloquent Models

---

## Lazy Loading Prevention Configuration

---

## Decision Context

Customizing lazy loading prevention behavior for admin panels or specific contexts.

---

## Decision Criteria

* reliability

---

## Decision Tree

Does the application use admin panels (Nova, Filament) that rely on lazy loading?
↓
YES → Use custom `LazyLoadingViolationException` handler — log instead of throw for admin routes
NO → Default behavior (throw exception) is appropriate for all routes

---

## Recommended Default

**Default:** Throw exception; customize for admin panels to log instead
**Reason:** Admin panels often access relationships dynamically; logging prevents disruption while still surfacing violations.

---

## Risks Of Wrong Choice

Throwing in admin panels breaks admin functionality. Silently allowing lazy loading everywhere hides N+1 problems.

---

## Related Rules

* Enable shouldBeStrict in AppServiceProvider::boot()

---

## Related Skills

* Configure Strict Mode for Eloquent Models

---

## Silent Discarding Prevention

---

## Decision Context

Deciding whether to enable `preventSilentlyDiscardingAttributes` to catch mass-assignment issues.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Are all mass-assignment attributes properly listed in `$fillable`?
↓
YES → Enabling the prevention adds safety net — won't trigger false positives
NO → Enable it anyway — forces you to fix the fillable configuration
NO → Is the application legacy (relies on silent discarding)?
    YES → Enable gradually — fix violations in batches
    NO → Enable immediately — silent discarding is a bug

---

## Recommended Default

**Default:** Enable `preventSilentlyDiscardingAttributes` everywhere
**Reason:** Silent attribute discarding causes subtle data integrity issues. It should never be the expected behavior.

---

## Risks Of Wrong Choice

Not enabling allows mass-assignment attempts to silently fail, causing data to be missing without any error indication.

---

## Related Rules

* Enable shouldBeStrict in AppServiceProvider::boot()

---

## Related Skills

* Configure Strict Mode for Eloquent Models
