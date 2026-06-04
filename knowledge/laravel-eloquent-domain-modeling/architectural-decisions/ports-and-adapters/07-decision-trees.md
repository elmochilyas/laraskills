# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** Ports and Adapters
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Hexagonal Architecture vs Simple MVC
* Decision 2: Port Design — Domain Concepts vs Adapter Capabilities
* Decision 3: One Port per Aggregate Root vs Per Entity
* Decision 4: Single Service Provider vs Scattered Bindings

---

# Architecture-Level Decision Trees

---

## Decision 1: Hexagonal Architecture vs Simple MVC

---

## Decision Context

Choose between full hexagonal architecture (ports/adapters with domain isolation) and simple MVC with Eloquent models used directly throughout the application.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the domain complex enough to justify test isolation without Laravel?
↓
YES → Does the domain need to be reusable across frameworks?
    YES → Hexagonal Architecture
    NO → Is the application a long-lived project (>3 years) with complex domain rules?
        YES → Hexagonal Architecture
        NO → Simple MVC
NO → Is the team large enough that strict boundaries prevent accidental coupling?
    YES → Hexagonal Architecture
    NO → Simple MVC

---

## Rationale

Hexagonal architecture provides strict boundaries, domain test isolation, and framework independence at the cost of indirection. Simple MVC with Eloquent models is faster to develop but makes domain logic depend on the framework. The choice depends on domain complexity, project lifespan, and team size.

---

## Recommended Default

**Default:** Simple MVC for most Laravel applications. Hexagonal architecture when domain complexity, team size, or framework independence requirements justify the overhead.
**Reason:** The indirection of ports and adapters carries real development cost. Most Laravel applications do not need framework-independent domain layers.

---

## Risks Of Wrong Choice

* Hexagonal for CRUD: interface explosion, mapping hell, developer frustration, slower delivery
* Simple MVC for complex domain: framework coupling, slow tests, business rules hidden in controllers, impossible framework migration

---

## Related Rules

* Rule 1: Design port interfaces around domain concepts (`05-rules.md`)
* Rule 2: Limit ports to aggregate root boundaries (`05-rules.md`)
* Rule 7: Ensure every port has at least two implementations (`05-rules.md`)

---

## Related Skills

* Implement a Port Interface with an Adapter (`06-skills.md` Skill 1)
* Set Up Service Provider Wiring (`06-skills.md` Skill 1)

---

## Decision 2: Port Design — Domain Concepts vs Adapter Capabilities

---

## Decision Context

Choose how to name and structure port interface methods: using domain language (business concepts) or using adapter-centric terminology (SQL, storage, implementation concerns).

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the method name describe a business concept?
↓
YES → Use the domain-language name (e.g., `findAllOverdueSince()`)
NO → Does the name leak storage or implementation terms (where, orderBy, join)?
    YES → Rename to describe the business meaning of the result
    NO → Is the method a generic capability (cache get/set, log write)?
        YES → Generic names are acceptable for genuinely cross-cutting concerns
        NO → Review whether the port expresses a real domain need

---

## Rationale

Ports express what the domain needs, not how the adapter stores or retrieves data. A method named `findWhere(array $criteria)` is a leaky abstraction that provides no hiding over direct Eloquent usage. Business-language names make the port's contract self-documenting and adapter-swappable.

---

## Recommended Default

**Default:** Name port methods using domain language. Never use SQL or storage terminology in port interfaces.
**Reason:** A leaky abstraction provides no benefit over using Eloquent directly. The port's value is in capturing domain concepts, not database operations.

---

## Risks Of Wrong Choice

* Leaky port naming: abstraction provides no hiding; adapter swap requires changing domain concepts; port doesn't hide infrastructure
* Overly abstract names: vague method names that don't communicate what the query returns

---

## Related Rules

* Rule 1: Design port interfaces around domain concepts (`05-rules.md`)

---

## Related Skills

* Implement a Port Interface with an Adapter (`06-skills.md` Skill 1)
* Write Contract Tests for a Port (`06-skills.md` Skill 2)

---

## Decision 3: One Port per Aggregate Root vs Per Entity

---

## Decision Context

Decide whether to create a port (repository interface) for each aggregate root only, or create separate ports for every database table and child entity.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the entity an aggregate root (transactional consistency boundary)?
↓
YES → Create one port for this aggregate root
NO → Is the entity a child entity with no independent persistence?
    YES → No port — access through its aggregate root's port
    NO → Is the entity heavily queried in isolation? (performance concern)
        YES → Create a read-only query object, not a write port
        NO → No port — access through aggregate root

---

## Rationale

Aggregate roots are the natural unit for repository abstraction because they are the transactional boundary. Child entities should never be persisted independently of their root, so they do not need their own repository port. Overriding this for performance should use a read-only query object, not a write repository.

---

## Recommended Default

**Default:** One port per aggregate root. Child entities accessed through their root's port. Read-only query objects for isolated query needs.
**Reason:** Port proliferation obscures aggregate boundaries and enables bypassing aggregate invariants. The aggregate root is the consistency boundary.

---

## Risks Of Wrong Choice

* Port per entity: 50+ interfaces, unclear transaction boundaries, child entities persisted independently, invariant bypass
* One port for everything: repository collects unrelated queries, interface becomes a dumping ground, SRP violation

---

## Related Rules

* Rule 2: Limit ports to aggregate root boundaries — one port per aggregate root (`05-rules.md`)
* Rule 5: Never return Eloquent models from adapter methods (`05-rules.md`)

---

## Related Skills

* Implement a Port Interface with an Adapter (`06-skills.md` Skill 1)
* Write Contract Tests for a Port (`06-skills.md` Skill 2)

---

## Decision 4: Single Service Provider vs Scattered Bindings

---

## Decision Context

Choose where to wire port-to-adapter bindings: in a single, centralized service provider or scattered across multiple providers, controllers, and application code.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Are there more than 5 port-to-adapter pairs?
↓
YES → Use one service provider per bounded context
NO → Can all bindings fit in one file without confusion?
    YES → Single service provider for entire application
    NO → Group by bounded context: one provider per context
→ In all cases: are there contextual bindings (when()->needs()->give())?
    YES → Keep in the same provider, documented with comments
    NO → Proceed

---

## Rationale

Centralized wiring makes the architecture's dependency graph visible and auditable in one location. Scattered bindings hide the active implementation for each port and make it impossible to verify correct wiring without searching the entire codebase.

---

## Recommended Default

**Default:** All port-to-adapter bindings in a single `DomainServiceProvider` for the whole app, or one provider per bounded context for larger projects.
**Reason:** A single list of bindings is the architecture diagram rendered as code. Any developer or auditor can see every port and its adapter in one file.

---

## Risks Of Wrong Choice

* Scattered bindings: impossible to audit which adapter implements which port, duplicate bindings cause runtime confusion, architecture drift goes unnoticed
* Single provider with too many bindings: file becomes unmanageable in large applications

---

## Related Rules

* Rule 4: Wire all port-to-adapter bindings in a single service provider (`05-rules.md`)
* Rule 8: Separate driver adapters from driven adapters in directory structure (`05-rules.md`)

---

## Related Skills

* Set Up Service Provider Wiring (`06-skills.md` Skill 3)
