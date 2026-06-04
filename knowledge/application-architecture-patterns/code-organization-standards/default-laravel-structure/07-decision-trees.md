# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Code Organization Standards
**Knowledge Unit:** Default Laravel directory structure and its design rationale
**Generated:** 2026-06-03

---

# Decision Inventory

* Stay with defaults vs adopt custom structure
* Add app/Services directory vs keep logic in Controllers
* Add app/Repositories vs use Eloquent directly

---

# Architecture-Level Decision Trees

---

## Stay With Defaults vs Adopt Custom Structure

---

## Decision Context

Laravel's default directory structure is optimized for small teams and rapid development. Deviating has setup costs (PSR-4 config, documentation, tooling) and ongoing costs (training, framework convention mismatch). The community consensus is: deviate only when measurable pain emerges.

---

## Decision Criteria

* performance considerations — custom structures add negligible runtime cost but increase boot time with multiple providers
* architectural considerations — domain isolation, team ownership, merge conflict reduction
* security considerations — custom directories can hide security-sensitive code if undocumented
* maintainability considerations — custom structures require documentation, enforcement, and onboarding overhead

---

## Decision Tree

Start with defaults?
↓
Team < 5 engineers?
YES → Stay with defaults
NO → Team 5-15 with multiple domains?
    YES → Hybrid approach (domain subdirectories within layers)
    NO → Team 15+ or clear bounded contexts?
        YES → Full domain-based structure
        NO → Stay with defaults

---

## Rationale

The default structure is self-documenting for any Laravel developer. Custom structures add learning overhead. The threshold for deviation should be concrete, recurring friction — not architectural fashion. Progress incrementally: defaults → hybrid → domain-based.

---

## Recommended Default

**Default:** Stay with Laravel's default directory structure
**Reason:** The default is production-capable, framework-aligned, and self-documenting. Deviations should respond to demonstrated pain, not anticipation of future needs.

---

## Risks Of Wrong Choice

Pre-emptive architecture wastes development time on unused abstractions. Half-migration (some code in new structure, some in old) is the worst outcome — neither structure is consistently applied, causing confusion about where new code goes.

---

## Related Rules

- R01: Use Default Structure for Projects Under 5 Engineers (COS-01/05-rules.md)
- R08: Start With Defaults, Evolve With Demonstrated Pain (COS-01/05-rules.md)

---

## Related Skills

- Apply Laravel's Default Directory Structure for Small Teams (COS-01/06-skills.md)
- Evaluate When to Deviate from Defaults (COS-09/06-skills.md)

---

## Add app/Services Directory vs Keep Logic in Controllers

---

## Decision Context

The first architectural extension most Laravel projects make is adding an `app/Services/` directory. The decision hinges on whether controllers have grown beyond HTTP orchestration into containing business logic.

---

## Decision Criteria

* performance considerations — no performance impact from service extraction
* architectural considerations — services enable testable business logic; controllers remain HTTP-only
* security considerations — service extraction does not change security boundaries
* maintainability considerations — services prevent fat controllers and enable logic reuse across CLI, queue, and HTTP

---

## Decision Tree

Controllers exceed 200 lines or contain business logic?
↓
Logic is simple CRUD with no business rules?
YES → Keep in Controller
NO → Logic is orchestration of multiple operations?
    YES → Extract to Service class
    NO → Logic is a single discrete operation?
        YES → Extract to Action class
        NO → Keep in Controller temporarily, plan refactoring

---

## Rationale

Controllers should only validate input (via Form Requests), call services, and return responses. Any business logic in controllers is untestable without HTTP bootstrap. Service extraction is the first architectural step every Laravel project needs.

---

## Recommended Default

**Default:** Add `app/Services/` directory when controllers exceed 200 lines
**Reason:** 200 lines is a reliable indicator that business logic has accumulated. Extracting earlier adds ceremony without demonstrated need.

---

## Risks Of Wrong Choice

Keeping logic in controllers leads to fat, untestable controllers. Extracting too early adds ceremony without benefit. Inconsistent extraction (some controllers use services, others don't) creates unpredictability.

---

## Related Rules

- R02: Extract Every Non-Trivial Business Operation to a Service Class (COS-02/05-rules.md)
- R01: Keep Controllers Free of Business Logic Beyond HTTP Orchestration (COS-02/05-rules.md)

---

## Related Skills

- Organize Code by Layer Within Default Laravel Structure (COS-02/06-skills.md)
- Design a Service Class (SLP-01/06-skills.md)

---

## Add app/Repositories vs Use Eloquent Directly

---

## Decision Context

Repository pattern in Laravel is controversial. Many teams add repositories without clear justification, adding ceremony without value. The decision depends on data source complexity and testing requirements.

---

## Decision Criteria

* performance considerations — repositories add indirection; Eloquent direct access is faster
* architectural considerations — repositories abstract data access; Eloquent is already an abstraction
* security considerations — no security impact from repository choice
* maintainability considerations — repositories add code but enable data source swapping and centralized query logic

---

## Decision Tree

Multiple data sources (API, cache, DB) for same entity?
YES → Repository pattern justified
NO → Need to mock data layer in unit tests?
    YES → Repository pattern justified
    NO → Queries are duplicated across services?
        YES → Extract query logic to Repository or Query Object
        NO → Use Eloquent directly from Service layer

---

## Rationale

Eloquent already implements the Active Record pattern. Adding a repository wrapper around single-source Eloquent models adds ceremony without value. Repositories are justified only when data access needs abstraction — multiple data sources or extensive query logic reuse.

---

## Recommended Default

**Default:** Use Eloquent directly from Service classes
**Reason:** Eloquent is already a well-designed abstraction. Repository pattern adds unnecessary indirection for single-source, simple CRUD applications.

---

## Risks Of Wrong Choice

Adding repositories without justification creates "repository-y service classes" — ceremony without value. Missing repositories when needed leads to duplicated query logic across services.

---

## Related Rules

- Rule: Never Create Repository-Wrapper Service Classes (COS-02/05-rules.md)
- Rule: Reject Repository Pattern for All-Model Single-DataSource Projects (COS-09/05-rules.md)

---

## Related Skills

- Design a Service Class (SLP-01/06-skills.md)
- Evaluate When to Deviate from Defaults (COS-09/06-skills.md)
