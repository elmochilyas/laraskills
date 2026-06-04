# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Transaction boundaries in layered architecture
**Generated:** 2026-06-03

---

# Decision Inventory

* Transaction in Use Case layer vs Repository layer
* Transactions spanning external API calls vs after-commit dispatch
* Database transaction vs eventual consistency for cross-aggregate operations

---

# Architecture-Level Decision Trees

---

## Transaction in Use Case Layer vs Repository Layer

---

## Decision Context

Transactions can be managed in the Application layer (Use Case/Service) or in the Repository layer. The choice determines composability — repositories wrapped in their own transactions cannot participate in larger units of work.

---

## Decision Criteria

* performance considerations — transactions hold database connections and locks; longer transactions increase contention
* architectural considerations — Use Case layer understands the full business operation scope
* security considerations — no direct security impact
* maintainability considerations — centralized transaction management is simpler to audit

---

## Decision Tree

Transaction ownership?
↓
Operation spans multiple repository calls (create + update + delete)?
YES → Use Case layer owns the transaction — single boundary
NO → Operation involves a single aggregate root?
    YES → Repository may manage its own transaction
    NO → Is the repository method called as part of a larger operation?
        YES → Use Case layer — repository must be composable
        NO → Repository-level transaction is acceptable

---

## Rationale

The Use Case (Application) layer understands the full scope of a business operation and should own the transaction boundary. Repository-level transactions prevent composition — a Use Case calling three repositories ends up with three separate transactions. Repository methods should participate in the caller's transaction.

---

## Recommended Default

**Default:** Use Case layer owns all transaction boundaries
**Reason:** The Application layer understands which operations belong together atomically. Repository methods should not wrap their own transactions — they participate in the caller's transaction. This enables composability.

---

## Risks Of Wrong Choice

Transactions in repositories prevent cross-repository atomicity — each repository commits independently. Transactions in controllers mix HTTP concerns with data consistency.

---

## Related Rules

- Rule: Place Transactions in Use Case/Service Layer (LAP-11/05-rules.md)
- Rule: Avoid Nested Transactions (LAP-11/05-rules.md)

---

## Related Skills

- Manage Transaction Boundaries in Application Layer (LAP-11/06-skills.md)
- Manage Transactions in Service Layer (SLP-11/06-skills.md)

---

## Transactions Spanning External API Calls vs After-Commit Dispatch

---

## Decision Context

External API calls (payment gateways, email services) within a transaction cannot be rolled back and may hold the transaction open. The decision is whether to include them or handle them after commit.

---

## Decision Criteria

* performance considerations — API calls within transactions hold DB connections for duration of HTTP request
* architectural considerations — API calls can't participate in DB transaction rollbacks
* security considerations — external failures within transactions may leave inconsistent state
* maintainability considerations — after-commit dispatch adds complexity (queues, events)

---

## Decision Tree

External API in transaction?
↓
Is the external API call critical to the transaction outcome?
YES → Validate API possibility before transaction (pre-flight check)
    Execute API call AFTER transaction commit
NO → Can the API call be deferred without affecting business correctness?
    YES → Dispatch after-commit event/job — decouple from transaction
    NO → Move API call before transaction or after commit

---

## Rationale

External API calls cannot be rolled back. Including them in a database transaction creates a false sense of atomicity — the DB rolls back, but the API call already happened. The pattern: validate preconditions (including API possibility) before the transaction, execute the transaction, then perform external API calls after commit.

---

## Recommended Default

**Default:** Keep external API calls outside database transaction boundaries
**Reason:** External calls can't participate in DB rollbacks. Including them creates long-lived transactions and false atomicity expectations. Use after-commit events for reliable deferred execution.

---

## Risks Of Wrong Choice

API calls within transactions cause long-lived locks and unrecoverable states when the DB rolls back but the API already executed. After-commit dispatch without error handling may lose operations on failure.

---

## Related Rules

- Rule: Move External API Calls Outside the Transaction (LAP-11/05-rules.md)
- Rule: Avoid Nested Transactions (LAP-11/05-rules.md)

---

## Related Skills

- Manage Transaction Boundaries in Application Layer (LAP-11/06-skills.md)
- Manage Transactions in Service Layer (SLP-11/06-skills.md)

---

## Database Transaction vs Eventual Consistency for Cross-Aggregate Operations

---

## Decision Context

Operations involving multiple aggregates present a choice: use a single database transaction for atomicity, or use events/sagas for eventual consistency. The choice depends on whether strict atomicity is required.

---

## Decision Criteria

* performance considerations — distributed transactions increase contention; eventual consistency is more scalable
* architectural considerations — atomic transactions guarantee consistency; eventual consistency accepts temporary inconsistency
* security considerations — eventual consistency must handle failure compensation (sagas)
* maintainability considerations — eventual consistency with sagas is more complex than single transactions

---

## Decision Tree

Cross-aggregate consistency model?
↓
Do aggregates share the same database?
YES → Single database transaction — atomic guarantee
NO → Must all aggregates succeed for the operation to be valid?
    YES → Saga pattern — compensating transactions on failure
    NO → Eventual consistency — dispatch event, each aggregate handles independently

---

## Rationale

If aggregates share a database, a single transaction provides the simplest consistency guarantee. If aggregates are in separate databases or systems, eventual consistency with saga compensation is required. The decision is driven by data distribution, not architectural preference.

---

## Recommended Default

**Default:** Single database transaction for same-database aggregates; eventual consistency with sagas for distributed aggregates
**Reason:** A single transaction is the simplest correct approach when all aggregates share one database. Eventual consistency with compensating actions is necessary when aggregates are in different databases or systems.

---

## Risks Of Wrong Choice

Database transactions for distributed aggregates create distributed transaction complexity. Eventual consistency for same-database aggregates adds unnecessary complexity.

---

## Related Rules

- Rule: Avoid Distributed Transaction Simulation (LAP-11/05-rules.md)
- Rule: Use Consistent Table Access Ordering Within Transactions (LAP-11/05-rules.md)

---

## Related Skills

- Manage Transaction Boundaries in Application Layer (LAP-11/06-skills.md)
- Handle Multi-Context Transactions (DBC-11/06-skills.md)
