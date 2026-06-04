# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Request Organization
**Generated:** 2026-06-03

---

# Decision Inventory

* Flat app/Http/Requests/ vs Domain-Subdirectory Organization
* Naming Convention: ActionEntityRequest vs EntityActionRequest
* Inheritance: Base Request Class vs Per-Action Duplication

---

# Architecture-Level Decision Trees

---

## Decision 1: Flat app/Http/Requests/ vs Domain-Subdirectory Organization

---

## Decision Context

Whether to place all FormRequest classes directly in `app/Http/Requests/` or organize them into entity/domain subdirectories.

---

## Decision Criteria

* Total number of FormRequest classes in the project
* Number of distinct entities or domains the requests belong to
* Whether the project uses feature-based or layer-based organization
* Whether the team prefers flat navigation or hierarchical grouping

---

## Decision Tree

How many FormRequest classes does the project have?
↓
<15 classes → Flat `app/Http/Requests/` — simple, no grouping needed
15-30 classes → Are there 3+ distinct entities with 3+ requests each?
    YES → Group by entity subdirectory — `app/Http/Requests/User/`, `app/Http/Requests/Post/`
    NO → Flat — insufficient entities to justify grouping
30+ classes → Group by entity subdirectory REQUIRED — flat listing is too long to scan
NO → Does the project use feature-based organization?
    YES → Co-locate requests inside feature modules — `app/Features/Billing/Requests/`
    NO → Group by entity subdirectory

---

## Rationale

Flat organization is simpler for small projects (under 15 request classes). At 30 classes, flat `app/Http/Requests/` becomes hard to scan — 30 files listed alphabetically, mixing unrelated entities. Entity-based subdirectories restore navigability by grouping related requests together. Feature-based projects should co-locate requests inside feature directories.

---

## Recommended Default

**Default:** Flat `app/Http/Requests/` for <15 classes. Entity-based subdirectories at 15+ classes. Feature-based projects co-locate requests.
**Reason:** The 15-class threshold is where the flat directory starts to require scrolling. Entity grouping makes navigation predictable.

---

## Risks Of Wrong Choice

* Flat at 30 classes: 30 files in one directory — impossible to scan, easy to create duplicates
* Entity grouping at 5 classes: 3 directories with 1-2 files each — unnecessary hierarchy
* Feature-based project with flat organization: Requests in `app/Http/Requests/`, everything else in features — split location
* Wrong entity grouping: Request could go in two entity directories — confusion about placement

---

## Related Rules

* Name FormRequests {Action}{Entity}Request Consistently

---

## Related Skills

* Organize FormRequests Using Domain-Based Directories

---

---

## Decision 2: Naming Convention: ActionEntityRequest vs EntityActionRequest

---

## Decision Context

Whether to name FormRequests as `StoreUserRequest` (action first) or `UserStoreRequest` (entity first).

---

## Decision Criteria

* Whether the naming convention groups related requests alphabetically in file listings
* Whether the naming reads naturally as an action
* Whether IDE search patterns prioritize entity or action
* Whether the project has an established convention

---

## Decision Tree

Does the project have an existing naming convention?
↓
YES → Follow the existing convention — consistency over individual preference
NO → Will the convention be used in a flat directory (no subdirectories)?
    YES → `{Action}{Entity}Request` — `StoreUserRequest`, `UpdateUserRequest` groups by action alphabetically
    NO → Will the convention be used in entity subdirectories?
        YES → `StoreRequest`, `UpdateRequest` — entity is implied by the directory name
        NO → `{Action}{Entity}Request` — standard convention
NO → Does the team IDE search by action ("store user") or entity ("user request")?
    Action → `{Action}{Entity}Request` — `StoreUserRequest`
    Entity → `{Entity}{Action}Request` — `UserStoreRequest`

---

## Rationale

`StoreUserRequest` reads as the natural English action "store a user." In flat directories, the action prefix groups related actions (`StoreUserRequest`, `UpdateUserRequest`, `IndexUserRequest`) alphabetically. In entity subdirectories, the entity is redundant — `User\StoreRequest` is cleaner. Consistency across the project is more important than the specific convention.

---

## Recommended Default

**Default:** `{Action}{Entity}Request` for projects without subdirectories. `{Action}Request` for projects using entity subdirectories.
**Reason:** Action-first naming groups related operations together alphabetically and reads naturally. Entity subdirectories make the entity prefix redundant.

---

## Risks Of Wrong Choice

* Entity-first in flat directory: `UserStoreRequest`, `UserUpdateRequest` — action not visible in quick scan
* Action-first in entity subdirectory: `User\StoreUserRequest` — redundant, `User\StoreRequest` is cleaner
* No convention: `StoreUserRequest` in one file, `UserStoreRequest` in another — inconsistent
* Very long names: `StoreAdminUserProfileRequest` — too many words, hard to read and type

---

## Related Rules

* Name FormRequests {Action}{Entity}Request Consistently

---

## Related Skills

* Organize FormRequests Using Domain-Based Directories

---

---

## Decision 3: Inheritance: Base Request Class vs Per-Action Duplication

---

## Decision Context

Whether to use inheritance (base FormRequest with common rules) or duplicate common rules across per-action FormRequests.

---

## Decision Criteria

* Whether multiple FormRequests share the same validation rules or data preparation
* Whether the shared rules are likely to change together (same business reason)
* Whether inheritance depth would exceed 2 levels
* Whether the team prefers composition over inheritance

---

## Decision Tree

Do 3+ FormRequests share the same validation rules or input preparation?
↓
YES → Do they share ALL rules or just a common subset?
    ALL rules → Single FormRequest — no need for inheritance
    Common subset → Create a base FormRequest with shared rules, extend for specific rules
NO → Do 2 FormRequests share a common data preparation pattern?
    YES → Use a trait — composition over inheritance for cross-cutting behavior
    NO → Do 2 FormRequests share authorization logic?
        YES → Use a trait or delegate to Policy — authorization doesn't belong in base Request
        NO → No inheritance needed — per-action duplication is fine for 1-2 shared rules
NO → Would inheritance depth exceed 2 levels (Base → Abstract → Concrete)?
    YES → Use composition (traits) instead of inheritance — deep hierarchies are fragile
    NO → Consider inheritance — shallow hierarchy is manageable

---

## Rationale

Inheritance is appropriate when FormRequests share rules that change together. A base `UserRequest` with shared rules, extended by `StoreUserRequest` and `UpdateUserRequest`, ensures common rules are in one place. Deep inheritance hierarchies (3+ levels) become hard to reason about — traits are a better alternative for cross-cutting concerns.

---

## Recommended Default

**Default:** Use shallow inheritance (1 level deep) when 3+ FormRequests share a common rule set. Use traits for cross-cutting concerns shared across unrelated request families.
**Reason:** Shallow inheritance provides meaningful reuse without the fragility of deep hierarchies. Traits provide composition for cross-cutting behavior that doesn't fit the inheritance tree.

---

## Risks Of Wrong Choice

* Deep inheritance (3+ levels): Hard to trace which class provides which rules — brittle
* No inheritance with 5 duplicate rules: Same rules copied across 5 FormRequests — update all five when rule changes
* Trait for everything: Too many traits on one class — unclear which methods come from where
* Base class with unrelated rules: `SharedRequest` with rules for User, Post, and Billing — coupling

---

## Related Rules

* FormRequest Inheritance for Shared Rules
* Trait-Based FormRequest Composition

---

## Related Skills

* Organize FormRequests Using Domain-Based Directories
