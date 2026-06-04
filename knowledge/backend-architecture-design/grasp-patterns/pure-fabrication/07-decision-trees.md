# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** GRASP: Pure Fabrication
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Domain class vs Pure Fabrication for a responsibility
* Decision 2: Naming strategy for fabricated classes
* Decision 3: Factory vs Repository vs Service for fabricated classes

---

# Architecture-Level Decision Trees

---

## Decision: Domain Class vs Pure Fabrication for a Responsibility

---

## Decision Context

Choose whether to place a responsibility on an existing domain class or create a new fabricated (non-domain) class.

---

## Decision Criteria

* performance considerations: fabrication adds an extra class; domain assignment has no extra overhead
* architectural considerations: domain classes should focus on domain logic; fabrications handle technical concerns
* security considerations: fabrications can enforce security boundaries; domain classes focus on invariants
* maintainability considerations: fabrications keep domain classes cohesive; over-fabrication adds navigation overhead

---

## Decision Tree

Is the responsibility a domain concept (part of the Ubiquitous Language)?
↓
YES → Does the domain class that naturally owns this responsibility already exist?
    YES → Does placing this responsibility on the domain class violate SRP?
        NO → Assign to the domain class (natural Information Expert)
        YES → Is SRP violation from domain logic or infrastructure concern?
            DOMAIN LOGIC → Consider if the class is the right expert; split domain class
            INFRASTRUCTURE → Create Pure Fabrication (domain shouldn't handle infrastructure)
    NO → Consider creating a new domain class if the concept is genuinely missing
        Otherwise, evaluate if a Pure Fabrication is more appropriate
NO → Is the responsibility an infrastructure concern (persistence, logging, HTTP, serialization)?
    YES → Pure Fabrication (infrastructure doesn't belong in domain)
NO → Would assigning to a domain class create excessive coupling?
    YES → Pure Fabrication (decouple domain from technical concerns)
    ↓
    Is the responsibility cross-cutting (logging, metrics, caching)?
    YES → Pure Fabrication or Decorator (cross-cutting concerns belong outside domain)
    ↓
    Would placing this in a domain class make testing harder?
    YES → Pure Fabrication (domain classes should be testable without infrastructure)

---

## Rationale

Pure Fabrications handle responsibilities that have no natural place in the domain model. Create them when: a responsibility is technical (infrastructure), would violate a domain class's SRP, or would create coupling. Don't fabricate for domain logic that naturally belongs on a domain class.

---

## Recommended Default

**Default:** Start with domain class assignment. Extract to Pure Fabrication when the domain class gains infrastructure dependencies or violates SRP.

**Reason:** Domain classes should own domain logic. Fabrications should handle technical concerns. YAGNI applies — don't fabricate until the need is proven.

---

## Risks Of Wrong Choice

Domain class handling infrastructure: SRP violation, untestable, non-portable. Everything as fabrication: no rich domain model, procedural code, domain logic scattered in services.

---

## Related Rules

- Rule 1: Introduce pure-fabrication classes to avoid low cohesion or high coupling in domain classes
- Rule 4: Pure-fabrication classes should not contain domain logic

---

## Related Skills

- Apply the Pure Fabrication GRASP Pattern
- Apply Information Expert GRASP Pattern

---

## Decision: Naming Strategy for Fabricated Classes

---

## Decision Context

Choose whether to name fabricated classes by their technical role or by a domain-inspired name.

---

## Decision Criteria

* performance considerations: naming has no performance impact
* architectural considerations: role-based names communicate technical purpose; domain names pollute the UL
* security considerations: role-based names make the class's function obvious
* maintainability considerations: role-based names reduce confusion about class purpose

---

## Decision Tree

Does the class implement a standard design pattern with a well-known name?
↓
YES → Use the pattern name (Repository, Factory, Adapter, Strategy, Facade, Builder)
NO → Does the class perform a clear technical role?
    YES → Role-based name (CsvExporter, EmailSender, FileStorage, CacheManager)
NO → Does the class have a domain-sounding purpose but is technically fabricated?
    YES → Would a domain name confuse the Ubiquitous Language?
        YES → Role-based name (TaxCalculator — both domain and technical; ambiguous but acceptable)
        NO → Negotiate: does the domain team use this term?
            YES → Use domain name if it doesn't pollute UL
            NO → Role-based name to avoid introducing pseudo-domain terms
    ↓
    Does the class coordinate other services?
    YES → Prefer "Orchestrator" or "Coordinator" over "Manager"
    ↓
    AVOID: "Helper", "Util", "Manager", "Processor" (too vague)
    PREFER: specific role names that describe what the class does

---

## Rationale

Fabricated classes should be named by their architectural role (Repository, Factory, Adapter) not by domain concepts. This prevents confusion between domain terms and technical artifacts. Well-known pattern names are the best choice because they communicate intent immediately.

---

## Recommended Default

**Default:** Name by the design pattern if applicable (Repository, Factory, Adapter). Name by specific role otherwise (CsvExporter, EmailSender). Avoid "Manager", "Helper", "Util".

**Reason:** Pattern names are universally understood. Specific role names communicate exact purpose. Vague names hide responsibility boundaries and accumulate unrelated code.

---

## Risks Of Wrong Choice

Domain name for fabrication: pollutes Ubiquitous Language, confuses domain experts, hides technical nature. "Manager" naming: catches everything, low cohesion, SRP violation.

---

## Related Rules

- Rule 2: Name pure-fabrication classes by their role, not by the domain concept they serve

---

## Related Skills

- Apply the Pure Fabrication GRASP Pattern

---

## Decision: Factory vs Repository vs Service for Fabricated Classes

---

## Decision Context

Choose the appropriate type of Pure Fabrication for the responsibility.

---

## Decision Criteria

* performance considerations: all have minimal overhead; factory pattern adds one creation method
* architectural considerations: each fabrication type serves a distinct architectural role
* security considerations: repositories can enforce data access control; factories can enforce creation policies
* maintainability considerations: choosing the wrong type creates confusion about class responsibility

---

## Decision Tree

Is the responsibility about creating objects (assembling, configuring, constructing)?
↓
YES → Is the creation simple (just `new` with parameters)?
    NO → Factory (encapsulates complex object creation)
NO → Is the responsibility about persisting and retrieving objects?
    YES → Is the persistence to a database?
        YES → Repository (standard pattern for domain object persistence)
        NO → Is the persistence to a file, cache, or external service?
            YES → Repository or Storage adapter (depending on the abstraction level)
NO → Is the responsibility about coordinating operations across multiple objects?
    YES → Is the coordination a use case step (application flow)?
        YES → Application Service (orchestrates use cases; may call domain and infrastructure)
        NO → Is the coordination purely domain logic (no infrastructure)?
            YES → Domain Service (operates on domain objects; no infrastructure dependencies)
    NO → Is the responsibility a translation between contexts?
        YES → Anti-Corruption Layer or Adapter (translates between bounded contexts)
    ↓
    Is the responsibility a cross-cutting concern (logging, metrics, caching)?
    YES → Decorator or Middleware (wraps existing classes transparently)
    ↓
    Document: class type, layer placement, rationale

---

## Rationale

Each Pure Fabrication type serves a specific architectural role: Factory (creation), Repository (persistence), Service (coordination), Adapter (translation), Decorator (cross-cutting). Choosing the wrong type creates confusion because developers will look for standard patterns in unexpected places.

---

## Recommended Default

**Default:** Repository for persistence. Application Service for use case orchestration. Factory for complex creation. Domain Service for pure domain coordination.

**Reason:** These are the standard, well-understood patterns for each responsibility. Consistency with standard patterns reduces cognitive load.

---

## Risks Of Wrong Choice

Service for everything: "Service" classes accumulate unrelated responsibilities, become God classes. Repository for creation: Repository is for persistence, not assembly. Factory for simple creation: unnecessary indirection.

---

## Related Rules

- Rule 3: Use Factories pure fabrications to handle complex object creation
- Rule 5: Don't fabricate unnecessarily—only introduce when cohesion/coupling demands it

---

## Related Skills

- Apply the Pure Fabrication GRASP Pattern
- Implement Repository Pattern
- Implement Factory Pattern
