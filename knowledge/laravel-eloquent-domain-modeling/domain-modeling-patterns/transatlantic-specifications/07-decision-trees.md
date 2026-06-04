# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Transatlantic Specifications
**Generated:** 2026-06-03

---

# Decision Inventory

* Specification vs query scope
* Specification composition strategy
* Dual evaluation (query + in-memory)

---

# Architecture-Level Decision Trees

---

## Specification vs Query Scope

---

## Decision Context

Choosing between a local query scope and a specification object for encapsulating a business rule.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the same business rule need to be evaluated both in queries AND in-memory?
↓
YES → Use specification pattern — provides both `applyToQuery()` and `isSatisfiedBy()`
NO → Are specifications composed (AND, OR, NOT) at runtime?
    YES → Specification pattern supports composition; query scopes do not
    NO → Is the rule a simple, one-off query condition?
        YES → Local query scope — simpler, sufficient
        NO → Specification — encapsulate complex rules

---

## Rationale

Query scopes are simple and sufficient for one-off conditions. Specifications provide composability and dual evaluation (query + in-memory), which is essential when the same rule is used for filtering, validation, and domain logic.

---

## Recommended Default

**Default:** Local query scope for simple one-off conditions
**Reason:** Simpler, less code, built into Laravel. Only escalate to specification when composition or dual evaluation is needed.

---

## Risks Of Wrong Choice

Using specifications for every query condition creates unnecessary file count. Using query scopes for rules that need both query and in-memory evaluation requires duplicating the rule.

---

## Related Rules

* Specification encapsulates one business rule
* Support both query and in-memory evaluation

---

## Related Skills

* Implement a Specification Pattern for Complex Queries

---

## Specification Composition Strategy

---

## Decision Context

Designing how specifications are combined (AND, OR, NOT) for complex criteria.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Are specifications composed at runtime in different combinations?
↓
YES → Implement composable operators (AndSpecification, OrSpecification, NotSpecification)
NO → Is the composition fixed (same combination always)?
    YES → Combine into a single specification class — simpler
    NO → Use composable operators for flexibility

---

## Rationale

Composable operators enable flexible runtime combination of specifications. Fixed combinations can be collapsed into a single specification to reduce class count.

---

## Recommended Default

**Default:** Composable operators for complex composition needs
**Reason:** Open/Closed — add new combinations without modifying existing specifications.

---

## Risks Of Wrong Choice

Fixed specification classes that compose internally lose the ability to recombine differently. Composable operators for a single fixed combination add unnecessary indirection.

---

## Related Rules

* Make specifications composable

---

## Related Skills

* Implement a Specification Pattern for Complex Queries

---

## Dual Evaluation Support

---

## Decision Context

Designing specifications that work both for database queries and in-memory validation.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Does the specification need to validate in-memory models AND filter database queries?
↓
YES → Implement both `applyToQuery()` and `isSatisfiedBy()` methods
NO → Is the specification only used for database queries?
    YES → Only `applyToQuery()` needed — local scope might be simpler
    NO → Is it only for in-memory checks?
        YES → A method on the model or a simple helper may suffice

---

## Rationale

Dual evaluation is the primary value of specifications over query scopes. When a rule is used for both filtering and validation, a specification prevents duplicating the logic.

---

## Recommended Default

**Default:** Implement both query and in-memory evaluation
**Reason:** Ensures the rule can be used consistently across all contexts.

---

## Risks Of Wrong Choice

Implementing only query evaluation means the in-memory check must duplicate the rule. Implementing only in-memory check means the database query cannot use the packaged rule.

---

## Related Rules

* Use specifications where rules repeat across contexts
* Test both applyToQuery and isSatisfiedBy

---

## Related Skills

* Implement a Specification Pattern for Complex Queries
