# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Code Organization Standards
**Knowledge Unit:** Feature-based naming conventions for classes and files
**Generated:** 2026-06-03

---

# Decision Inventory

* Verb-Noun (Action) vs {Domain}Service naming for business logic classes
* Past-tense vs present-tense for event classes
* Generic suffixes (Manager/Helper) vs role-specific suffixes (Service/Action)

---

# Architecture-Level Decision Trees

---

## Verb-Noun (Action) vs {Domain}Service Naming for Business Logic Classes

---

## Decision Context

Business logic classes can be named as actions (Verb-Noun: `CreateInvoice`, `ProcessPayment`) or services ({Domain}Service: `InvoiceService`, `PaymentService`). The choice communicates whether the class handles a single operation or orchestrates multiple related operations.

---

## Decision Criteria

* performance considerations — no performance impact from naming
* architectural considerations — action naming signals single responsibility; service naming signals orchestration
* security considerations — no security impact
* maintainability considerations — action naming prevents god classes; service naming groups related operations

---

## Decision Tree

Business logic class naming?
↓
Class performs a single discrete business operation?
YES → Use Verb-Noun pattern: `CreateInvoice`, `ProcessPayment`
NO → Class orchestrates multiple related operations for a domain?
    YES → Use {Domain}Service pattern: `InvoiceService`, `PaymentService`
    NO → Class is a query that fetches/aggregates data?
        YES → Use Query Object pattern: `InvoiceListQuery`
        NO → Use {Domain}Service as default

---

## Rationale

Verb-Noun communicates exactly what a class does — operation and subject. {Domain}Service communicates that a class handles all operations for a domain entity. Actions prevent god services; services prevent action proliferation.

---

## Recommended Default

**Default:** Use Verb-Noun action naming for single-operation classes; {Domain}Service for orchestration classes
**Reason:** Action naming is the stronger convention — it prevents ambiguous names and communicates exact responsibility. Service naming is appropriate for entity-oriented orchestration.

---

## Risks Of Wrong Choice

Action-named classes that grow to handle multiple operations violate the name's contract. Service-named classes with only one method waste the grouping potential of services.

---

## Related Rules

- R01: Use Verb-Noun Pattern for Action Classes (COS-08/05-rules.md)
- R03: Use {Domain}Service for Service Names (COS-08/05-rules.md)

---

## Related Skills

- Apply Naming Conventions for Classes and Files (COS-08/06-skills.md)
- Design a Service Class (SLP-01/06-skills.md)
- Create Action Classes for Business Operations (SLP-02/06-skills.md)

---

## Past-Tense vs Present-Tense for Event Classes

---

## Decision Context

Event class names can be past-tense (`UserRegistered`) or present-tense (`UserRegistration`, `RegisterUser`). The choice distinguishes events (something that already happened) from commands (something that should happen).

---

## Decision Criteria

* performance considerations — no performance impact
* architectural considerations — past-tense distinguishes events from commands
* security considerations — no security impact
* maintainability considerations — consistent tense prevents confusion about event timing

---

## Decision Tree

Event class naming?
↓
Does the class describe something that already happened?
YES → Use past-tense: `UserRegistered`, `OrderShipped`, `PaymentFailed`
NO → Does the class describe an action to be performed?
    YES → This is a command/action, not an event — use Verb-Noun instead
    NO → Does the class represent a state or process?
        YES → Use present-tense noun for state; past-tense for events
        NO → Use past-tense as default for event classes

---

## Rationale

Events describe something that has already happened. Past-tense naming communicates this temporal semantics clearly — unlike a command (future/imperative), an event is a record of the past. `UserRegistered` is clearly an event; `RegisterUser` sounds like a command.

---

## Recommended Default

**Default:** Use past-tense naming for all event classes
**Reason:** Past-tense clearly communicates that the event describes something already happened. This distinguishes events from commands/actions and prevents accidental dispatching of events as commands.

---

## Risks Of Wrong Choice

Present-tense event names (`RegisterUser`, `UserRegistration`) create confusion — they sound like commands or processes, not records of past events. This can lead to dispatching actions as events and vice versa.

---

## Related Rules

- R02: Use Past-Tense for Event Classes (COS-08/05-rules.md)
- R04: Never Use `Manager`, `Helper`, `Handler`, or `Processor` as Suffixes (COS-08/05-rules.md)

---

## Related Skills

- Apply Naming Conventions for Classes and Files (COS-08/06-skills.md)
- Design Domain Events (CPC-02/06-skills.md)

---

## Generic Suffixes (Manager/Helper) vs Role-Specific Suffixes (Service/Action)

---

## Decision Context

Class names like `PaymentManager`, `UserHelper`, `DataHandler` don't communicate architectural role. Role-specific suffixes like `Service`, `Action`, `UseCase` clearly indicate what a class does.

---

## Decision Criteria

* performance considerations — no performance impact
* architectural considerations — role-specific suffixes enable code review to catch misplaced logic by name alone
* security considerations — no security impact
* maintainability considerations — generic suffixes obscure class responsibility

---

## Decision Tree

Class suffix choice?
↓
Does the suffix communicate architectural role?
YES → Use it consistently
NO → Does the class orchestrate multiple operations?
    YES → Use `Service` suffix
    NO → Does the class execute a single operation?
        YES → Use `Action` or `UseCase` suffix
        NO → Does the class transform data between formats?
            YES → Use `Normalizer`, `Mapper`, or `Transformer`
            NO → Does the class provide data access?
                YES → Use `Repository` or `Query`
                NO → Discuss with team — avoid generic suffixes

---

## Rationale

Generic suffixes (`Manager`, `Helper`, `Handler`, `Processor`) don't communicate what a class does. Role-specific suffixes (`Service`, `Action`, `UseCase`, `Normalizer`, `Gateway`) immediately communicate architectural role and enable code review to catch misplaced logic based on name alone.

---

## Recommended Default

**Default:** Prohibit `Manager`, `Helper`, `Handler`, and `Processor` as class name suffixes
**Reason:** These suffixes don't communicate architectural role and lead to classes with unclear responsibilities. Use role-specific suffixes: `Service`, `Action`, `UseCase`, `Normalizer`, `Gateway`.

---

## Risks Of Wrong Choice

Generic suffixes accumulate classes with undefined responsibilities. Over time, `Manager` and `Helper` become dumping grounds for code that doesn't fit elsewhere — recreating the catch-all directory problem at the class name level.

---

## Related Rules

- R04: Never Use `Manager`, `Helper`, `Handler`, or `Processor` as Suffixes (COS-08/05-rules.md)
- R07: Document Naming Conventions in Team Documentation (COS-08/05-rules.md)

---

## Related Skills

- Apply Naming Conventions for Classes and Files (COS-08/06-skills.md)
- Document Team Conventions and Architecture (AEG-07/06-skills.md)
