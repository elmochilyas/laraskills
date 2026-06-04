# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** When Repositories Hurt
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Repository Layer vs Direct Eloquent Usage
* Decision 2: Repository Interface vs No Interface
* Decision 3: Repository Mock vs Real Database Test
* Decision 4: Repository Finder Method vs Query Object

---

# Architecture-Level Decision Trees

---

## Decision 1: Repository Layer vs Direct Eloquent Usage

---

## Decision Context

Determine whether to wrap Eloquent model access behind a repository layer or use Eloquent models directly throughout the application.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the application have more than one storage backend (SQL + Redis, MySQL + MongoDB)?
↓
YES → Repository Layer (abstraction provides value)
NO → Is there a realistic, planned scenario for switching storage backends?
    YES → Repository Layer
    NO → Does the only justification for the repository relate to testing?
        YES → Direct Eloquent Usage (Laravel's RefreshDatabase + SQLite already handles this)
        NO → Direct Eloquent Usage

---

## Rationale

The repository pattern's primary benefit is storage backend abstraction. In a standard Laravel application with a single SQL database and Eloquent, the indirection adds files, cognitive load, and maintenance cost without enabling any capability that direct Eloquent usage does not provide. Laravel's built-in testing infrastructure already solves the "swap database for tests" argument.

---

## Recommended Default

**Default:** Direct Eloquent usage. Add repositories only when you have a concrete, current need for storage abstraction, not as a default architectural layer.
**Reason:** A repository that wraps Eloquent 1:1 provides no abstraction value — it's pure ceremony. You can extract a repository later when the need arises.

---

## Risks Of Wrong Choice

* Repository as default: 50+ files with zero benefit, development velocity slows from indirection, developers bypass the abstraction when it adds friction
* Direct Eloquent with actual storage variation: changing all callers if backend switches, no single point for cross-cutting data access concerns

---

## Related Rules

* Rule 1: Do not create a repository when only one storage backend exists (`05-rules.md`)
* Rule 2: Never create a repository whose interface mirrors Eloquent's API (`05-rules.md`)
* Rule 5: Prefer direct Eloquent usage in actions (`05-rules.md`)

---

## Related Skills

* Remove an Unnecessary Repository Abstraction (`06-skills.md` Skill 1)

---

## Decision 2: Repository Interface vs No Interface

---

## Decision Context

Choose whether a repository implementation should have a corresponding interface or be used directly without interface abstraction.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the repository have exactly one implementation with no realistic prospect of a second?
↓
YES → Does the interface serve as a test seam with an active in-memory implementation?
    YES → Keep interface and in-memory implementation
    NO → Delete the interface, use the implementation class or Eloquent directly
NO → Does the interface mirror Eloquent's API exactly (save, find, findOrFail, create)?
    YES → Delete the interface — it provides no abstraction value
    NO → Keep the interface — multiple implementations benefit from the abstraction

---

## Rationale

An interface with a single implementation adds maintenance cost (interface file, implementation file, service provider binding, IDE navigation overhead) without providing storage abstraction. The exception is when the in-memory implementation is actively used in tests and provides value beyond what SQLite testing offers.

---

## Recommended Default

**Default:** No interface for single-implementation repositories. Delete interfaces that mirror Eloquent's API.
**Reason:** Every abstraction carries cognitive cost. When the interface adds no capability, removing it reduces complexity without losing anything.

---

## Risks Of Wrong Choice

* Interface for single implementation: unnecessary files, binding maintenance, developers question the architecture
* No interface with multiple implementations: can't swap implementations in tests, hard-coded coupling to one storage backend

---

## Related Rules

* Rule 2: Never create a repository whose interface mirrors Eloquent's API exactly (`05-rules.md`)
* Rule 4: Delete unused repository interfaces that have only one implementation (`05-rules.md`)

---

## Related Skills

* Remove an Unnecessary Repository Abstraction (`06-skills.md` Skill 1)

---

## Decision 3: Repository Mock vs Real Database Test

---

## Decision Context

Choose between mocking a repository in a test and using a real database (SQLite in-memory) with model factories.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the test exercising code that queries or persists data?
↓
YES → Does the test involve your own SQL queries or Eloquent model logic?
    YES → Real Database (RefreshDatabase + SQLite + model factories)
    NO → Is the test verifying interaction with an external API?
        YES → Mock at the HTTP client level, not the repository
        NO → Real Database
NO → Does the test have no data access at all?
    → No change needed — pure unit test

---

## Rationale

Mocking a repository hides SQL errors, missing columns, wrong casts, and constraint violations in the Eloquent implementation. Tests pass with mocks but fail against the real database. Real database tests catch these issues at test time rather than production.

---

## Recommended Default

**Default:** Use `RefreshDatabase` with SQLite in-memory and model factories for tests involving data access.
**Reason:** Real database tests catch SQL errors that mocks cannot. Laravel's in-memory SQLite testing is fast enough that there is rarely a performance reason to mock.

---

## Risks Of Wrong Choice

* Mock repository tests: false positives — tests pass but production code fails with SQL errors, developer confidence erodes
* Real database for everything: slower for pure unit tests with no data access, unnecessary database setup

---

## Related Rules

* Rule 3: Test with real databases and model factories, not repository mocks (`05-rules.md`)
* Rule 6: If the only reason for a repository is "testing," remove it (`05-rules.md`)

---

## Related Skills

* Refactor a Repository Test to Use Real Database (`06-skills.md` Skill 2)

---

## Decision 4: Repository Finder Method vs Query Object

---

## Decision Context

Choose between adding a finder method to a repository or extracting it into a dedicated Query Object class.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the finder method a simple identity lookup (findById, findBySlug)?
↓
YES → Keep on the repository (core persistence contract)
NO → Does the repository already have 5+ finder methods?
    YES → Extract to Query Object
    NO → Does the query have 3+ conditions, joins, or aggregations?
        YES → Extract to Query Object
        NO → Is the query reused in multiple callers independently?
            YES → Extract to Query Object
            NO → Inline in the caller (if simple enough)

---

## Rationale

Repository finder methods accumulate over time, turning the repository into a dumping ground for unrelated queries. Query Objects are single-responsibility classes named after the result they return, making them discoverable and independently testable. The repository should focus on its core persistence contract.

---

## Recommended Default

**Default:** Keep `findById` on the repository. Extract complex or multi-caller queries to dedicated Query Objects.
**Reason:** The repository's core contract is CRUD at the aggregate boundary. Complex read queries are a separate concern best encapsulated in their own class.

---

## Risks Of Wrong Choice

* Finder methods on repository: repository grows to 20+ methods, mixed read/write concerns, queries hard to find
* Query Object for `findById`: over-engineering, unnecessary class explosion for simple lookups

---

## Related Rules

* Rule 7: Extract to a Query Object when queries become complex (`05-rules.md`)
* Rule 8: Never nest transactions — ensure repositories do not create their own (`05-rules.md`)

---

## Related Skills

* Migrate Repository Finder Methods to Query Objects (`06-skills.md` Skill 3)
