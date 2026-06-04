# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Application layer: use cases, DTOs, application services
**Generated:** 2026-06-03

---

# Decision Inventory

* Use Case class vs Service class for orchestration
* Specific DTO per use case vs shared DTO across use cases
* Command-Query Separation vs combined read-write operations

---

# Architecture-Level Decision Trees

---

## Use Case Class vs Service Class for Orchestration

---

## Decision Context

Both Use Case (Interactor) and Service classes orchestrate operations in the Application layer. Use Cases are single-purpose classes with one public method. Service classes group multiple related operations. The choice affects granularity and discoverability.

---

## Decision Criteria

* performance considerations — no performance difference
* architectural considerations — use cases provide single-purpose clarity; services group related operations
* security considerations — use cases enable per-operation authorization
* maintainability considerations — use cases prevent god services; services reduce file count

---

## Decision Tree

Orchestration class type?
↓
Operation is a single, distinct user goal (CreateInvoice, ProcessRefund)?
YES → Use Case class — one public `execute()` method
NO → Multiple related operations share dependencies and configuration?
    YES → Service class — group related operations
    NO → Is the operation used across multiple delivery mechanisms?
        YES → Use Case class — uniform entry point
        NO → Service class — simpler pattern

---

## Rationale

Use Cases provide the clearest expression of application capabilities — each is a class representing a single user goal. Services are appropriate when multiple operations share significant setup or dependencies. In Clean Architecture, Use Cases are the standard pattern; services are a simplification for smaller applications.

---

## Recommended Default

**Default:** Use Case classes for Clean Architecture; Service classes for three-layer architecture
**Reason:** Use Cases provide single-purpose clarity and uniform entry points. Services are simpler and sufficient for three-layer architecture. The choice depends on architectural ambition.

---

## Risks Of Wrong Choice

Use Cases for every trivial operation create file proliferation. Services that grow to handle 10+ operations become god objects.

---

## Related Rules

- Rule: Use Case Has Single Public Method (LAP-02/05-rules.md)
- Rule: Keep Use Cases Free of Business Rules (LAP-06/05-rules.md)

---

## Related Skills

- Apply Use Cases in Application Layer (LAP-06/06-skills.md)
- Create Action Classes for Business Operations (SLP-02/06-skills.md)

---

## Specific DTO per Use Case vs Shared DTO Across Use Cases

---

## Decision Context

DTOs carry data between layers. Specific DTOs per use case contain exactly the fields needed. Shared DTOs carry all possible fields across use cases, resulting in null-able fields and unclear contracts.

---

## Decision Criteria

* performance considerations — no significant performance difference
* architectural considerations — specific DTOs provide clear contracts; shared DTOs are ambiguous
* security considerations — specific DTOs prevent over-exposure of fields
* maintainability considerations — specific DTOs are more files but clearer; shared DTOs save files but hide dependencies

---

## Decision Tree

DTO strategy?
↓
Do multiple use cases share the exact same input fields?
YES → Consider shared DTO — but verify fields are truly identical
NO → Does each use case have different input requirements?
    YES → Specific DTO per use case — clear contract
    NO → Shared DTO with optional fields?
        YES → Split into specific DTOs — optional fields indicate different concerns
        NO → Specific DTO per use case

---

## Rationale

Each use case should have its own input DTO with exactly the fields it needs. Shared DTOs with optional/nullable fields create unclear contracts — it's not obvious which fields belong to which use case. Specific DTOs are more files but provide self-documenting contracts.

---

## Recommended Default

**Default:** Specific DTO per use case
**Reason:** Each use case has unique input requirements. Fat DTOs carrying all possible fields are a code smell. Specific DTOs provide clear contracts and prevent over-exposure.

---

## Risks Of Wrong Choice

Fat shared DTOs create unclear contracts and encourage field over-exposure. Specific DTOs for every use case create file proliferation for operations with identical inputs.

---

## Related Rules

- Rule: Use Specific DTOs Per Use Case (LAP-06/05-rules.md)
- Rule: Keep Use Cases Free of Business Rules (LAP-06/05-rules.md)

---

## Related Skills

- Apply Use Cases in Application Layer (LAP-06/06-skills.md)
- Apply DTO Pattern for Type Safety (SLP-05/06-skills.md)

---

## Command-Query Separation vs Combined Read-Write Operations

---

## Decision Context

CQS principle states that methods should be either commands (change state, return void) or queries (return data, no side effects). Combined operations mix reads and writes, making state changes harder to predict.

---

## Decision Criteria

* performance considerations — CQS supports caching; combined operations don't
* architectural considerations — CQS provides clearer contracts; combined is simpler
* security considerations — CQS enables separate read/write authorization
* maintainability considerations — CQS prevents side-effect surprises; combined is faster to write

---

## Decision Tree

Operation type?
↓
Does the operation change application state?
YES → Command — return void or simple ID
    Does it also return data?
        YES → Separate command and query — CQS principle
        NO → Pure command — mutate and return void
NO → Query — return data, no side effects
    Does it accidentally trigger side effects?
        YES → Refactor to remove side effects — query must be pure
        NO → Pure query — cacheable and safe

---

## Rationale

Command-Query Separation prevents unexpected side effects from read operations. Commands mutate state and return minimal results. Queries return data without side effects. This enables caching for queries and clear intent for commands.

---

## Recommended Default

**Default:** Apply CQS — separate command and query operations
**Reason:** CQS prevents side-effect surprises, enables query caching, and provides clear contracts. The overhead of separating read and write operations is minimal compared to the clarity benefit.

---

## Risks Of Wrong Choice

Combined operations make it impossible to safely cache queries and risk unexpected mutations from read paths. Strict CQS for every trivial operation adds ceremony without benefit.

---

## Related Rules

- Rule: Apply Command-Query Separation (LAP-06/05-rules.md)
- Rule: Keep Use Cases Free of Business Rules (LAP-06/05-rules.md)

---

## Related Skills

- Apply Use Cases in Application Layer (LAP-06/06-skills.md)
- Apply CQRS Pattern for Command-Query Separation (CPC-08/06-skills.md)
