# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Service Injection
**Generated:** 2026-06-03

---

# Decision Inventory

* @inject vs Controller Data
* @inject vs View Composer
* @inject vs Component Constructor Injection

---

# Architecture-Level Decision Trees

---

## Decision 1: @inject vs Controller Data

---

## Decision Context

Whether to access a service directly in the template via `@inject` or pass its data from the controller.

---

## Decision Criteria

* Whether the data is primary page content or auxiliary (settings, navigation)
* Whether the data needs to be testable via controller tests
* Whether the data is for a single view or multiple views

---

## Decision Tree

Is this data the PRIMARY content of the page (the resource being displayed)?
↓
YES → Controller data — pass explicitly from controller action to view
NO → Is this data auxiliary (settings, navigation, analytics, feature flags)?
    YES → Is this service used in exactly one template?
        YES → @inject is simpler than adding controller-passthrough for one view
        NO → View composer or controller data — avoid @inject repetition
    NO → Does the service data change per request (user-specific)?
        YES → Controller data or view composer (user context)
        NO → Is the service read-only and non-entity?
            YES → @inject is acceptable (singleton service with read methods)
            NO → Controller data (entity/repository data belongs in controller)

---

## Rationale

`@inject` creates hidden dependencies that bypass the controller's data preparation. For primary page content, controller-passed data is essential for testability and data flow visibility. For auxiliary read-only services used in one template, `@inject` is a pragmatic shortcut.

---

## Recommended Default

**Default:** Controller data for primary content; @inject for auxiliary, read-only services (settings, navigation, analytics) used in one template
**Reason:** Primary content must be testable and traceable. Auxiliary services add ceremony if passed through the controller for every view.

---

## Risks Of Wrong Choice

* @inject for primary data: Hidden data flow, cannot be tested in controller tests
* Controller data for one-off settings call: Controller must resolve a service just to pass data through
* @inject for entity data: Couples view to persistence layer

---

## Related Rules

* Use `@inject` Only for Non-Entity, Read-Only Services (05-rules.md)

---

## Related Skills

* Skill: Use @inject for Non-Entity Read-Only Services

---

## Decision 2: @inject vs View Composer

---

## Decision Context

Whether to access a service via `@inject` in each template or register a view composer that provides data to matching views automatically.

---

## Decision Criteria

* Number of templates that need the service data
* Whether the data source may change (requiring updates to each template)
* Whether the data is truly global or view-specific

---

## Decision Tree

Does the service data need to be shared across multiple (3+) views?
↓
YES → View composer — registered once, applies to all matching views automatically
NO → Is this service used in exactly one template?
    YES → @inject is simpler than creating a dedicated composer class
    NO → Evaluate:
        Could the data be needed by future templates?
            YES → View composer (future-proof, single registration point)
            NO → @inject (pragmatic for 1-2 templates)
NO → Does the service interface change frequently?
    YES → View composer (change one registration, not every template)
    NO → @inject

---

## Rationale

A view composer is registered once and applies to all matching views automatically. `@inject` must be added to every template individually, leading to inconsistent application and maintenance overhead when the service changes. For data needed across many views, composers provide a single registration point.

---

## Recommended Default

**Default:** View composer for data shared across multiple views; @inject for one-off service access in a single template
**Reason:** Composers centralize registration and ensure consistency. @inject avoids overhead of creating a composer class for a single template usage.

---

## Risks Of Wrong Choice

* @inject in 5+ templates: Inconsistent — forgotten on some templates, hard to update when service changes
* Composer for single template: Unnecessary class and registration for one usage
* Composer as catch-all: Too many dependencies in one composer class

---

## Related Rules

* Prefer View Composers Over `@inject` for Shared Data (05-rules.md)

---

## Related Skills

* Skill: Implement View Composers for Shared Data
* Skill: Use @inject for Non-Entity Read-Only Services

---

## Decision 3: @inject vs Component Constructor Injection

---

## Decision Context

Whether to use `@inject` inside a component's Blade template or inject the service via the component class constructor.

---

## Decision Criteria

* Whether the component is class-based or anonymous
* Whether the component's consumers should know about the dependency
* Whether the component needs to be tested in isolation

---

## Decision Tree

Is the component class-based (has a PHP class)?
↓
YES → Constructor injection in the component class — NEVER @inject in the component's Blade view
NO → Is the component anonymous (only a Blade file)?
    YES → Is the service a simple, non-entity, read-only service?
        YES → @inject is acceptable but document as technical debt
        NO → Refactor to a class-based component with constructor injection
NO → Does the component need to be unit-testable?
    YES → Constructor injection (class-based component) — @inject cannot be tested
    NO → @inject may be acceptable for trivial components

---

## Rationale

Class-based components can receive services via constructor injection, making dependencies explicit, testable, and documented in the component class. `@inject` inside a component view hides the dependency — the consumer of `<x-alert>` has no way to know that the component relies on an injected service.

---

## Recommended Default

**Default:** Constructor injection in class-based components; never @inject inside component views
**Reason:** Constructor injection makes dependencies visible, testable, and documented. @inject creates hidden coupling that surprises component consumers.

---

## Risks Of Wrong Choice

* @inject in class-based component: Hidden dependency, cannot be tested in isolation
* @inject in anonymous component: Dependency invisible to consumers, test requires full container
* Constructor injection for trivial anonymous component: Requires converting to class-based for a simple dependency

---

## Related Rules

* Do Not Use `@inject` Inside Component Views (05-rules.md)

---

## Related Skills

* Skill: Use @inject for Non-Entity Read-Only Services
