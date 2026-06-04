# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Design
**Knowledge Unit:** Directory Structure
**Generated:** 2026-06-03

---

# Decision Inventory

* Flat vs domain-based directory structure
* Namespace alignment
* Consistency enforcement

---

# Architecture-Level Decision Trees

---

## Flat vs Domain-Based Directory Structure

---

## Decision Context

Choosing between a flat `app/Models/` directory and domain-based subdirectories for model files.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Are there more than 20 models in the application?
↓
YES → Is navigating the flat directory becoming difficult?
    YES → Split into domain subdirectories — group by business domain
    NO → Keep flat — splitting without pain is premature organization
NO → Flat structure in `app/Models/` is sufficient

---

## Recommended Default

**Default:** Flat structure for fewer than 20 models
**Reason:** Simplest to navigate, search, and refactor. Only split when navigation suffers.

---

## Risks Of Wrong Choice

Premature domain splitting adds organizational overhead without benefit. Avoiding splitting when navigation is painful wastes developer time searching for models.

---

## Related Rules

* Start Flat, Split by Domain When Navigation Suffers

---

## Related Skills

* Organize Models by Domain in Subdirectories

---

## Namespace Alignment

---

## Decision Context

Ensuring model namespaces match their directory structure.

---

## Decision Criteria

* reliability

---

## Decision Tree

Does the directory path match the namespace segments?
↓
YES → PSR-4 autoloading works correctly
NO → Mismatch causes autoloading errors — fix namespace to match directory path

---

## Recommended Default

**Default:** Namespace exactly mirrors directory path from `app/` root
**Reason:** PSR-4 autoloading depends on this mapping.

---

## Risks Of Wrong Choice

Autoloading errors in production; stale class loading from cached autoloader.

---

## Related Rules

* Match Namespace Exactly to Directory Structure

---

## Related Skills

* Organize Models by Domain in Subdirectories

---

## Consistency Enforcement

---

## Decision Context

Applying one organizational pattern consistently across the entire application.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Is one organizational pattern applied to ALL models?
↓
YES → Consistent — predictable mental model for developers
NO → Are flat and domain-based approaches mixed?
    YES → WRONG — mixed patterns increase cognitive load
    NO → Choose one pattern and apply to all models

---

## Recommended Default

**Default:** One pattern, consistently applied
**Reason:** Predictability reduces cognitive load when finding or placing model files.

---

## Risks Of Wrong Choice

Mixed patterns force developers to check both directory convention and individual namespace, increasing lookup errors.

---

## Related Rules

* Apply One Organizational Pattern Consistently

---

## Related Skills

* Organize Models by Domain in Subdirectories
