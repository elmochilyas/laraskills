# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Livewire Lifecycle Hooks
**Generated:** 2026-06-03

---

# Decision Inventory

* mount() vs boot() for Data Initialization
* updating vs updated for Property Validation/Transformation
* Lifecycle Hook vs Dedicated Action Method for Side Effects

---

# Architecture-Level Decision Trees

---

## Decision 1: mount() vs boot() for Data Initialization

---

## Decision Context

Whether to initialize component data in `mount()` (runs only on first render) or `boot()` (runs on every request including subsequent AJAX updates).

---

## Decision Criteria

* Whether the data should be fresh on every request (real-time data)
* Whether the data should be loaded only once (initial setup, expensive queries)
* Whether the initialization depends on mount parameters
* Whether the data is static or dynamic

---

## Decision Tree

Should the data be fetched fresh on EVERY request (including subsequent AJAX updates)?
↓
YES → Use `boot()` — runs on every request, ensures fresh data
NO → Should the data be initialized only once (first render)?
    YES → Use `mount()` — runs only on first component creation
    NO → Does the initialization depend on mount parameters (`$title`, `$postId`)?
        YES → Use `mount()` — mount receives parameters from the Blade directive
        NO → Is the initialization expensive (database query, API call)?
            YES → Use `mount()` — run once, don't re-query on every AJAX update
            NO → Use property default — `public int $count = 0;` — simplest initialization

---

## Rationale

`mount()` runs once when the component is first created and rendered. `boot()` runs on every request — initial render and every subsequent AJAX update. Data that must be fresh (unread notifications, real-time stats) belongs in `boot()`. Data that is loaded once (user profile, initial dataset) belongs in `mount()`.

---

## Recommended Default

**Default:** `mount()` for one-time initialization. `boot()` for fresh data on every request. Property defaults for simple static values.
**Reason:** `mount()` avoids redundant queries. `boot()` ensures data freshness. Property defaults are simplest for values that don't need computation.

---

## Risks Of Wrong Choice

* `mount()` for real-time data: Data fetched once, stale after AJAX updates — user sees outdated info
* `boot()` for expensive query: Query runs on every keystroke — unnecessary load, slow UX
* `mount()` called on AJAX update: Expecting `mount()` to run, but it doesn't — stale or missing data
* No initialization: Property is null — runtime error when accessed

---

## Related Rules

* Use mount for One-Time Initialization

---

## Related Skills

* Use Lifecycle Hooks Effectively in Livewire Components

---

---

## Decision 2: updating vs updated for Property Validation/Transformation

---

## Decision Context

Whether to use `updating[Property]()` (fires before the property is set) or `updated[Property]()` (fires after the property is set) for property change handling.

---

## Decision Criteria

* Whether the logic should validate the new value BEFORE it's set
* Whether the logic should react to the new value AFTER it's set
* Whether the logic should prevent the update if validation fails
* Whether the logic depends on both old and new values

---

## Decision Tree

Does the logic need to validate the incoming value and potentially prevent the update?
↓
YES → Use `updating($value)` — fires before setting, can modify or reject the value
NO → Does the logic need to react to the new value AFTER it's already set (query based on new value)?
    YES → Use `updated()` — fires after the property is set, new value is available
    NO → Does the logic need access to the old value (before-change)?
        YES → Use `updating($oldValue)` — receives the current (old) value as parameter
        NO → Does the logic need to trigger a side effect based on the new value?
            YES → Use `updated()` — property is set, safe to trigger side effects
            NO → Use property getter or computed property — simpler than hooks

---

## Rationale

`updating` is for pre-change concerns — validation, transformation, rejection. `updated` is for post-change reactions — refreshing related data, dispatching events, triggering side effects. The choice depends on whether the logic should run before or after the property mutation.

---

## Recommended Default

**Default:** `updated()` for post-change reactions. `updating()` only when the value must be validated or transformed BEFORE it's set.
**Reason:** Most property change logic reacts to the new value, which requires `updated()`. Pre-change hooks should be reserved for validation and transformation.

---

## Risks Of Wrong Choice

* `updating()` for post-change reaction: Fires before value is set — works with old value, not new
* `updated()` for validation: Value is already set — can't prevent the update
* Neither hook used: Property changes silently — no reaction to state change
* Expensive logic in `updated()`: Runs on every keystroke — debounce expensive operations

---

## Related Rules

* updating for Pre-Change, updated for Post-Change

---

## Related Skills

* Use Lifecycle Hooks Effectively in Livewire Components

---

---

## Decision 3: Lifecycle Hook vs Dedicated Action Method for Side Effects

---

## Decision Context

Whether to perform side effects (database writes, email sending, API calls) in a lifecycle hook (`updated`, `mount`) or in a dedicated action method (`save`, `submit`).

---

## Decision Criteria

* Whether the side effect is triggered by a user action (button click) or a property change
* Whether the side effect should be explicitly called or automatically triggered
* Whether the side effect should be testable in isolation
* Whether the user needs feedback after the side effect completes

---

## Decision Tree

Is the side effect triggered by a user action (button click, form submit)?
↓
YES → Use a dedicated action method — `save()`, `submit()` — explicit, testable, user-initiated
NO → Is the side effect triggered by a property change (dropdown selection, checkbox toggle)?
    YES → Use `updated[Property]()` — automatic reaction to state change
    NO → Is the side effect intended to run on component initialization?
        YES → Use `mount()` or `boot()` — automatic on component creation/request
        NO → Use a dedicated action method — explicit user actions should never be in lifecycle hooks
NO → Does the side effect need user feedback (success message, error display)?
    YES → Use a dedicated action method — action methods return responses and can show feedback
    NO → Use lifecycle hook — background operation, no user interaction

---

## Rationale

Lifecycle hooks are for automatic reactions to state changes. Dedicated action methods are for explicit user-initiated operations. Side effects that need user feedback (success/error messages) should be in action methods where feedback can be displayed. Side effects that should run automatically (log on property change) belong in hooks.

---

## Recommended Default

**Default:** Dedicated action methods for all user-initiated side effects. Lifecycle hooks only for automatic reactions to property changes.
**Reason:** User actions should be explicit, testable, and provide feedback. Lifecycle hooks are implicit and better suited for automatic reactions.

---

## Risks Of Wrong Choice

* Side effect in `updated()` for button click: Action runs automatically on any property change — unintended execution
* Side effect in action method triggered by property change: User must click button to trigger — not automatic
* Side effect in `mount()` that needs feedback: `mount()` can't show loading state or error messages
* Side effect in `updated()` that throws: Unhandled exception in lifecycle hook — component broken

---

## Related Rules

* Action Methods for User-Initiated Side Effects

---

## Related Skills

* Use Lifecycle Hooks Effectively in Livewire Components
