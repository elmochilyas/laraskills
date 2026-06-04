# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Action Pattern
**Knowledge Unit:** Action Naming Conventions
**Generated:** 2026-06-03

---

# Decision Inventory

* VerbNoun vs NounVerb Naming Convention
* ActionSuffix vs No Suffix
* Method Name Convention for Actions

---

# Architecture-Level Decision Trees

---

## Decision 1: VerbNoun vs NounVerb Naming Convention

---

## Decision Context

Whether to name action classes with the verb first (`CreateOrder`) or the noun first (`OrderCreate`).

---

## Decision Criteria

* Whether the team thinks in terms of operations or entities
* Whether the action directory is flat or domain-subdirectoried
* Whether the application is CRUD-heavy or domain-heavy

---

## Decision Tree

Does the team think in terms of operations ("I need to create something")?
↓
YES → VerbNoun (`CreateOrder`, `CancelOrder`, `RefundOrder`)
    Optimizes operation-first discovery — all "Create" actions cluster alphabetically
NO → Does the team think in terms of entities ("I need to do something with Orders")?
    YES → NounVerb (`OrderCreate`, `OrderCancel`, `OrderRefund`)
        Optimizes entity-first discovery — all "Order" actions cluster
    NO → Default to VerbNoun (most common in Laravel ecosystem)
NO → Is the application CRUD-heavy (create/update/delete on many entities)?
    YES → VerbNoun — CRUD verbs are universally understood
    NO → Is the application domain-heavy (healthcare, finance, logistics)?
        YES → Evaluate NounVerb if entity grouping is more valuable
        NO → VerbNoun

---

## Rationale

VerbNoun is the most common convention, follows natural English reading order, and is supported by Jetstream, Spatie examples, and most Laravel training materials. NounVerb is a specialization for domains where entity grouping is more valuable than operation grouping.

---

## Recommended Default

**Default:** VerbNoun (`CreateOrder`, `CancelOrder`) for all projects, with domain subdirectories for scale
**Reason:** VerbNoun is the ecosystem standard. Domain subdirectories solve entity-grouping needs without renaming.

---

## Risks Of Wrong Choice

* NounVerb for CRUD-heavy: Read operations scatter by entity, unnatural naming
* Mixing both: Unpredictable, developers cannot guess action names
* Switching conventions later: Mass rename of 50+ files

---

## Related Rules

* Choose One Naming Convention and Apply It Consistently (05-rules.md)
* Prefer VerbNoun as Default, Switch to NounVerb Only for Entity-Heavy Domains (05-rules.md)

---

## Related Skills

* Skill: Choose and Document a Naming Convention

---

## Decision 2: ActionSuffix vs No Suffix

---

## Decision Context

Whether to append `Action` to the class name (`CreateOrderAction` vs `CreateOrder`).

---

## Decision Criteria

* Whether actions coexist with other class types in the same namespace
* Whether the codebase has naming collisions potential
* Whether the team prefers explicit type identification in imports

---

## Decision Tree

Do actions coexist with other class types (models, DTOs, jobs) in the same namespace/directory?
↓
YES → Use ActionSuffix (`CreateOrderAction`)
    Differentiates from `CreateOrderJob`, `CreateOrderData`, etc.
NO → Are actions in their own namespace (`App\Actions`)?
    YES → Omit the suffix — namespace provides the context
    NO → Is the codebase open source or a shared library?
        YES → Use ActionSuffix (consumers may import alongside other types)
        NO → Omit the suffix
NO → Does the team prefer explicit type identification in import statements?
    YES → Use ActionSuffix consistently
    NO → Omit the suffix

---

## Rationale

The `App\Actions` namespace already provides unambiguous context — a class in `App\Actions\CreateOrder` is clearly an action. Adding `Action` suffix to every file creates longer class names and import statements with no benefit when the namespace already distinguishes them.

---

## Recommended Default

**Default:** Omit the ActionSuffix when using `App\Actions` namespace; add suffix only when actions share a namespace with other class types
**Reason:** The namespace already identifies the type. The suffix is redundant in `App\Actions`.

---

## Risks Of Wrong Choice

* Inconsistent suffix: Some actions have it, others don't — worst of both worlds
* Suffix in `App\Actions`: Redundant, longer names with no benefit

---

## Related Rules

* Use ActionSuffix Only When Necessary to Avoid Name Collisions (05-rules.md)

---

## Related Skills

* Skill: Choose and Document a Naming Convention

---

## Decision 3: Method Name Convention for Actions

---

## Decision Context

What single method name to use for all actions — `handle()`, `execute()`, or `__invoke()`.

---

## Decision Criteria

* Whether the team uses Spatie's QueueableAction (auto-detection)
* Whether the team follows Jetstream conventions
* Whether the team prefers generic or domain-specific method names

---

## Decision Tree

Does the team use Spatie's `QueueableAction` trait?
↓
YES → `execute()` is auto-detected (no override needed)
    `handle()` requires overriding `queueMethod()` to return `'handle'`
    `__invoke()` is also auto-detected (first priority)
NO → Does the team follow Jetstream conventions?
    YES → Domain-specific method names: `create()`, `update()`, `delete()`
    NO → Generic method name across all actions?
        YES → `handle()` (most common in community) or `execute()` (QueueableAction compatible)
        NO → Domain-specific names for each action
NO → Does the team prefer `__invoke()` for callable syntax?
    YES → `__invoke()` — enables `$action($data)` callable usage
    NO → `handle()` or `execute()`

---

## Rationale

Consistent method naming across all actions reduces cognitive load. Mixed method names force developers to check each action individually. If using QueueableAction, `execute()` avoids the `queueMethod()` override requirement.

---

## Recommended Default

**Default:** `handle()` as the team standard; `execute()` if using Spatie's QueueableAction
**Reason:** `handle()` is the most common community convention. `execute()` is auto-detected by QueueableAction. Choose one and enforce across all actions.

---

## Risks Of Wrong Choice

* Mixed method names: Developers must check each action's method name
* `handle()` with QueueableAction without override: Worker-time crash (undefined method `execute()`)
* Domain-specific names inconsistently: Unpredictable across codebase

---

## Related Rules

* Establish a Single Method Name Convention Across the Team (05-rules.md)
* Match Method Name to Class Intent (05-rules.md)
* Override `queueMethod()` When Using Non-Standard Method Names (05-rules.md)

---

## Related Skills

* Skill: Choose and Document a Naming Convention
