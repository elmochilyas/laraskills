# ECC Standardized Knowledge — Action Naming Conventions

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Action Pattern |
| **Knowledge Unit** | Action Naming Conventions |
| **Difficulty** | Foundation |
| **Category** | Application Architecture — Business Logic Organization |
| **Last Updated** | 2026-06-02 |

---

## Overview

Action naming conventions determine how developers find, identify, and reason about single-operation classes across a codebase. Unlike service naming (which follows entity-oriented conventions like `UserService`), action naming has no single standard — the community uses four competing conventions (VerbNoun, NounVerb, ActionSuffix, Descriptive Method) with different tradeoffs for navigation, discoverability, and cognitive load.

The engineering significance is that naming conventions directly affect codebase scalability. A convention that works for 10 actions (flat file listing, natural verb-noun order) breaks at 100 actions (alphabetical scattering, naming collisions, file overload). The right convention depends on team size, action count, and navigation preferences. Domain subdirectories (which group actions by entity) are the practical answer to these scaling concerns — they make the naming convention less critical by providing an alternative organizational axis.

---

## Core Concepts

### The Four Naming Conventions

**VerbNoun (most common):** `CreateOrder`, `UpdateUser`, `DeleteProduct`. Files sort by verb — all "Create" actions cluster alphabetically. Optimizes operation-first discovery. Natural English reading. Most common in the Laravel ecosystem.

**NounVerb (ResourceVerb):** `OrderCreate`, `UserUpdate`, `ProductDelete`. Files sort by resource — all "Order" operations cluster alphabetically. Optimizes entity-first discovery. Less natural English but more practical for entity-heavy domains.

**VerbNoun + ActionSuffix:** `CreateOrderAction`, `UpdateUserAction`. The `Action` suffix eliminates ambiguity with models, DTOs, or value objects. Redundant with the `App\Actions` namespace but useful in codebases where naming collisions are possible.

**VerbNoun + Descriptive Method (Jetstream):** Class `CreateTeam`, method `create()`. The class name is the action identity; the method name describes the specific operation. Enables method polymorphism but adds indirection — the caller must know both the class and the method.

### Semantic Units of Action Names

Every action name contains a Verb (the operation), a Noun (the subject), and optionally a Qualifier (the type marker like `Action`). The convention determines the order of these units and whether the qualifier is included.

### The Critical Rule

The most harmful naming anti-pattern is a mix of conventions within the same codebase. A codebase with `CreateOrder`, `UserUpdate`, and `CancelOrderAction` in the same directory creates cognitive chaos — developers can never predict the name of an action they have not seen. Consistency across the entire action directory is more important than which specific convention is chosen.

---

## When To Use

- **VerbNoun** when the team thinks in terms of operations: "I need to create something" → search for "Create*". Best for CRUD-heavy applications with < 30 actions.
- **NounVerb** when the team thinks in terms of entities: "I need to do something with Orders" → find all "Order*" actions. Best for domain-heavy applications.
- **ActionSuffix** when actions coexist with other class types (models, DTOs, jobs) in the same directory or when the codebase has large teams or is open source with multiple contributors.
- **Descriptive Method** when following Jetstream conventions or when method name polymorphism (`create()` returns different types across different action classes) is valuable.
- **Domain subdirectories** when any action directory exceeds 20 files — the subdirectory pattern (`app/Actions/Order/CreateOrder.php`) makes naming conventions less critical.

---

## When NOT To Use

- Do NOT use VerbNoun when the entity is the primary organizational unit and file adjacency by entity is more important than operation clustering.
- Do NOT use NounVerb for operations that are universally understood by their verb (e.g., `LoginUser` is more natural than `UserLogin`).
- Do NOT use ActionSuffix when the namespace (`App\Actions`) already provides unambiguous context — the suffix becomes redundant and adds typing overhead for no benefit.
- Do NOT use a mix of conventions within the same codebase. Inconsistency is worse than any single convention choice.

---

## Best Practices (WHY)

- **Be consistent across all actions.** The single most important rule. Choose one convention and enforce it across the entire action directory. Consistency makes actions predictable — developers know the name of any action before they open the file.
- **Use domain subdirectories before changing conventions.** Flat VerbNoun becomes unmanageable at 50+ actions. Rather than switching to NounVerb (which requires renaming every existing action), add subdirectories per domain. Subdirectories solve the same navigation problem without renaming.
- **Document the decision explicitly.** Write down which convention the team uses, why, and under what conditions it might change. New team members should not have to infer the convention from existing code.
- **Match method name to class intent.** An action class `CreateOrder` should use `create()` or `handle()` as its method name, not `process()`. The method name reinforces the class identity.
- **Prefer grep-friendly patterns.** All conventions are equally grep-friendly as long as they are consistent. The grep concern is about consistency, not about which convention is chosen.

---

## Architecture Guidelines

- **Flat VerbNoun directory structure** is acceptable for < 30 actions. Beyond that, add domain subdirectories.
- **Domain subdirectories** should mirror the application's bounded contexts: `app/Actions/User/`, `app/Actions/Order/`, `app/Actions/Billing/`.
- **Action class naming is PSR-4 compliant** — the class name determines the filename. `CreateOrder` maps to `CreateOrder.php`.
- **Renaming convention is a breaking change** — switching from VerbNoun to NounVerb after 50+ actions requires renames of every class, import, and test reference.
- **IDE navigation** benefits from NounVerb for entity-heavy domains (all Order operations adjacent) and VerbNoun for operation-heavy domains (all "Create" operations adjacent).
- **ActionSuffix** is redundant with the `App\Actions` namespace but provides visual clarity in import statements and stack traces. The tradeoff is longer class names for unambiguous type identification.
- **Jetstream compatibility** extends only to projects that use Jetstream scaffolding. Teams extending Jetstream actions should maintain its convention; teams building independently can choose any convention.

---

## Performance

Naming convention has zero impact on runtime performance. Class names are resolved via autoloading (PSR-4), which is cached by OpCache. The length of the class name, the presence of a suffix, and the ordering of semantic units do not affect execution speed. At extreme scale (500+ actions in a flat directory), IDE file listings and autocomplete may slow down — the solution is subdirectories per domain, not a naming convention change.

---

## Security

No direct security implications. Action naming does not affect authentication, authorization, input validation, or data access control. However, clear naming conventions reduce the risk of accidentally exposing internal actions (e.g., a `DeleteAllUsersAction` that is easily discoverable by its name). If an action should not be publicly callable, its name alone is not a security boundary — access control must be enforced separately.

---

## Common Mistakes

- **Mixing VerbNoun and NounVerb in the same directory.** Inconsistency forces developers to guess the name of every action.
- **Inconsistent ActionSuffix usage.** Some actions with `Action` suffix, others without — creates the worst of both worlds (inconsistent naming with no benefit).
- **Verb-noun for read operations without subdirectories.** `GetOrder`, `ShowOrder`, `FindOrder`, `ListOrders` scatter under "G," "S," "F," "L" in VerbNoun ordering. NounVerb or subdirectories keep read operations adjacent.
- **Method name mismatch with class name.** Class `CreateOrder` with method `process()` creates confusion. The method name should either be generic `handle()` or descriptive `create()` — never conflicting with the class intent.
- **Choosing a convention by personal preference rather than codebase scale.** A convention that works at 10 actions may fail at 100. Choose with future scale in mind.

---

## Anti-Patterns

- **Inconsistent mix of all four conventions.** The most destructive anti-pattern. Some actions named `CreateOrder`, others `OrderCreate`, others `CreateOrderAction`, each with different method names (`handle()`, `execute()`, `create()`). This makes the codebase unpredictable at every turn.
- **Action name collision across domains.** `App\Actions\CreateOrder` in both e-commerce and purchasing domains. Resolved by domain subdirectories (`App\Actions\Ecommerce\CreateOrder`).
- **NounVerb for obviously operation-first domains.** If every operation is a creation (`CreateUser`, `CreateTeam`, `CreateProject`), NounVerb (`UserCreate`, `TeamCreate`, `ProjectCreate`) adds no entity-grouping benefit because the entity varies with every operation.
- **Flat directory with no grouping at scale.** 200+ actions in a single `app/Actions/` directory with VerbNoun naming. Developers cannot find anything without IDE search.

---

## Examples

### VerbNoun Pattern (Standard)
```php
// app/Actions/CreateOrder.php
class CreateOrder
{
    public function execute(array $data): Order { ... }
}

// app/Actions/CancelOrder.php
class CancelOrder
{
    public function execute(Order $order): void { ... }
}
```
Files sorted in IDE: `CancelOrder`, `CreateOrder`, ... All "Create" operations cluster.

### NounVerb Pattern (Entity-First)
```php
// app/Actions/OrderCreate.php
class OrderCreate
{
    public function execute(array $data): Order { ... }
}

// app/Actions/OrderCancel.php
class OrderCancel
{
    public function execute(Order $order): void { ... }
}
```
Files sorted in IDE: `OrderCancel`, `OrderCreate`, ... All "Order" operations cluster.

### Domain Subdirectory Pattern (Recommended at Scale)
```php
// app/Actions/Order/CreateOrder.php
namespace App\Actions\Order;
class CreateOrder { ... }

// app/Actions/User/CreateUser.php
namespace App\Actions\User;
class CreateUser { ... }
```
Subdirectories per domain provide entity grouping without relying on class name ordering.

---

## Related Topics

- **Action Class Design** (prerequisite) — understanding what an action is informs how it should be named.
- **Action Composition** — how action names affect readability in orchestration code.
- **Directory Conventions** — how `app/Actions/` subdirectory structure complements naming conventions.
- **Action vs Service vs Use Case** — how naming patterns differ across the three organizational patterns.
- **Feature-based Structure** — how action names interact with feature-based (domain) directory layouts.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Action Class Design (prerequisite), Action Composition (peer), Directory Conventions (peer).
- **Decision axis:** The naming convention choice is about optimizing either operation-first discovery (VerbNoun) or entity-first discovery (NounVerb). The practical answer at scale is domain subdirectories, which make the naming convention secondary.
- **Consistency rule:** The single most important rule is consistency across all actions, not which specific convention is chosen.
- **Migration cost:** Changing conventions after 50+ actions is a project-wide refactor. Choose early and change only with strong justification.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| All four naming conventions documented | ✓ |
| When to use / when NOT to use each convention | ✓ |
| Best practices with rationale | ✓ |
| Architecture guidelines with directory structure | ✓ |
| Performance analysis | ✓ |
| Security considerations | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples for each pattern | ✓ |
| Related topics mapped | ✓ |
