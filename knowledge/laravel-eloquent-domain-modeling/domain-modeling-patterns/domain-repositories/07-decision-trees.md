# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Domain Repositories
**Generated:** 2026-06-03

---

# Decision Inventory

* Repository vs direct Eloquent usage
* Repository interface design
* Repository scope (per aggregate vs per entity)

---

# Architecture-Level Decision Trees

---

## Repository vs Direct Eloquent Usage

---

## Decision Context

Deciding whether to add a repository layer between domain code and Eloquent.

---

## Decision Criteria

* architectural
* maintainability
* performance

---

## Decision Tree

Is there more than one data source (Eloquent + external API + file system)?
↓
YES → Repository pattern abstracts multiple storage backends
NO → Do you need in-memory test implementations (no database)?
    YES → Repository with in-memory implementation enables fast unit tests
    NO → Is the aggregate root's persistence complex (custom hydration, event store)?
        YES → Repository encapsulates complex persistence logic
        NO → Direct Eloquent usage is simpler — repository would just mirror Eloquent's API

---

## Rationale

Repositories add value when they abstract something complex (multiple data sources, non-Eloquent storage) or enable testability (in-memory implementations). When the only data source is an Eloquent model backed by MySQL, a repository is a leaky abstraction that mirrors Eloquent's API.

---

## Recommended Default

**Default:** Direct Eloquent without repository layer
**Reason:** Eloquent is already a data access abstraction. Adding a repository over it adds indirection without benefit in single-database applications.

---

## Risks Of Wrong Choice

Adding a repository that mirrors Eloquent's API creates unnecessary abstraction and file count without solving any real problem. Not using a repository when multiple data sources exist couples domain code to Eloquent.

---

## Related Rules

* Design interfaces around domain concepts, not data operations
* One repository per aggregate root

---

## Related Skills

* Create a Domain Repository for an Aggregate Root

---

## Repository Interface Design

---

## Decision Context

Designing the repository interface methods — domain-focused vs data-focused.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the method name describe the business concept or the data operation?
↓
Business concept → Correct — `findActiveSubscriptions()`, `findOverdueInvoices()`
Data operation → Wrong — `findWhere(array $criteria)`, `findByAttributes(array $data)`
    ↓
    Refactor to use business language that expresses domain intent

---

## Rationale

Repository interfaces should speak the ubiquitous language, not SQL. `findWhere()` leaks database concepts into the domain. `findOverdueInvoices()` expresses the domain intent and encapsulates the query criteria.

---

## Recommended Default

**Default:** Domain-specific method names on repository interfaces
**Reason:** Expresses business intent, encapsulates query details, and communicates in the ubiquitous language.

---

## Risks Of Wrong Choice

Generic `findWhere()` methods are just Eloquent leaky abstractions — callers must know the underlying schema to use them, defeating the repository's purpose.

---

## Related Rules

* Repository interface uses domain language, not SQL terms

---

## Related Skills

* Create a Domain Repository for an Aggregate Root

---

## Repository Scope

---

## Decision Context

Determining which models need repositories — every entity or only aggregate roots.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the model an aggregate root?
↓
YES → Does the root have complex persistence requirements or multiple data sources?
    YES → Create a repository for this aggregate root
    NO → Direct Eloquent is sufficient — repository not needed
NO → Is the model a child entity within an aggregate?
    YES → Do NOT create a repository — access through the aggregate root only
    NO → Is the model independently consistent (no parent aggregate)?
        YES → It's a standalone aggregate root — evaluate repository need as above

---

## Rationale

Repositories are for aggregate roots with persistence complexity. Child entities should only be accessed through their root and don't need their own repositories.

---

## Recommended Default

**Default:** No repository; use Eloquent directly
**Reason:** Minimizes abstraction overhead. Only add repositories where they solve a real problem.

---

## Risks Of Wrong Choice

Creating repositories for every entity creates dozens of unnecessary interfaces and implementations. Not creating a repository for an aggregate root with complex persistence needs scatters storage logic.

---

## Related Rules

* Repository is created only for aggregate roots with storage variation needs

---

## Related Skills

* Create a Domain Repository for an Aggregate Root
