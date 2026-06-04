## Monolith vs Bounded Contexts

Choosing between a single-context Laravel application and dividing the codebase into bounded contexts.

---

## Decision Context

When the application grows in complexity, you must decide whether to keep all code in a single context or split into bounded contexts by business capability.

---

## Decision Criteria

* number of distinct business subdomains
* team size and structure
* codebase manageability
* whether the same term has different meanings in different contexts
* whether different contexts need independent deployment

---

## Decision Tree

Organizing the application codebase?

↓

Does the application have 3+ distinct business subdomains (billing, inventory, shipping)?

YES → Consider bounded contexts

    Are different teams responsible for different subdomains?

    YES → Bounded contexts are strongly recommended

NO → Is the codebase manageable as a single context?

    YES → Single Laravel app structure is sufficient

    NO → Split into bounded contexts

---

## Rationale

Bounded contexts provide clear boundaries between business capabilities, each with its own models, controllers, and persistence. They prevent model pollution where a `User` in Sales context has different semantics than `User` in Support context. The cost is increased complexity in cross-context communication.

---

## Recommended Default

**Default:** Start with a single context; split into bounded contexts when the team or domain complexity demands it
**Reason:** Premature context splitting adds overhead; bounded contexts solve problems that appear at scale

---

## Risks Of Wrong Choice

Monolithic structure for a complex domain leads to model pollution and coupling; premature bounded context splitting adds unnecessary cross-context communication overhead.

---

## Related Rules

- Context organization conventions (from bounded-contexts standardized knowledge)

---

## Related Skills

- Context map creation (domain-modeling-patterns/06-skills.md)

---

## Cross-Context Communication (Events vs APIs vs Shared Database)

Choosing between events, APIs, and shared databases for communication between bounded contexts.

---

## Decision Context

When bounded contexts need to share information, you must choose the communication mechanism.

---

## Decision Criteria

* whether eventual consistency is acceptable
* latency requirements
* coupling tolerance
* whether one context needs immediate response from another

---

## Decision Tree

Communicating between bounded contexts?

↓

Is eventual consistency acceptable?

YES → Use Domain Events (decoupled, async)

NO → Do you need immediate response?

    YES → Use Service API (HTTP/gRPC call)

NO → Avoid shared databases (creates coupling)

Shared Database → Last resort, creates tight coupling between contexts

---

## Rationale

Domain events provide the best decoupling — the emitting context doesn't know which other contexts listen. APIs provide synchronous communication with defined contracts. Shared databases create invisible coupling that breaks the purpose of bounded contexts.

---

## Recommended Default

**Default:** Domain events for async communication; service APIs for synchronous needs
**Reason:** Events decouple contexts; APIs provide contracts; shared databases defeat the purpose of contexts

---

## Risks Of Wrong Choice

Tight coupling via shared databases; synchronous API calls creating latency chains; eventual consistency surprises from event-based communication.
