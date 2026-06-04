## Rule: Use mount for One-Time Initialization

Reserve mount() for data loading that should happen only on the component's first render, not on subsequent AJAX updates.

---

## Category

Architecture

---

## Rule

Place initial data loading (fetching from DB, setting up initial state) in mount() only if that data should NOT be refreshed on every subsequent AJAX request. Put data that must be fresh on every request in oot() instead.

---

## Reason

mount() runs only once — when the component is first created and rendered. On subsequent AJAX updates (actions, property changes), mount() does NOT run. Data loaded in mount() can become stale during the component's lifetime. oot() runs on every request (initial + subsequent), so fresh data belongs there.

---

## Bad Example

`php
public function mount(): void
{
    ->notifications = Notification::unread(); // Stale on subsequent actions
}
`

---

## Good Example

`php
public function boot(): void
{
    ->notifications = Notification::unread(); // Fresh on every request
}
`

---

## Exceptions

Data that never changes during a component's lifetime (e.g., the authenticated user object, a post fetched by ID) belongs in mount() because re-fetching it on every AJAX request is wasteful.

---

## Consequences Of Violation

Reliability risks: stale data displayed after user interactions. Performance risks: unnecessary re-fetching of static data.

---

## Rule: Keep Lifecycle Hooks Lightweight

Never perform expensive database queries, API calls, or heavy computations inside lifecycle hooks.

---

## Category

Performance

---

## Rule

Restrict oot(), hydrate(), updating(), and updated() hooks to operations that complete in under 5ms. Move expensive work to action methods, #[Computed] properties, or lazy-loaded contexts.

---

## Reason

Lifecycle hooks execute on EVERY request that triggers their phase. A 100ms database query in oot() adds 100ms to every single component interaction — every button click, every wire:model update, every event dispatch. For frequently-interacted components, this multiplies into seconds of cumulative delay.

---

## Bad Example

`php
public function boot(): void
{
    ->heavyData = ExpensiveReport::generate(); // Runs on every interaction
}
`

---

## Good Example

`php
public function boot(): void
{
    // Lightweight — just setup, no queries
}

public function refreshReport(): void
{
    ->heavyData = ExpensiveReport::generate(); // Runs only when requested
}
`

---

## Exceptions

The #[Computed] attribute caches expensive computations for the duration of a single request and is the correct way to handle derived data within hooks. Use computed properties instead of raw queries.

---

## Consequences Of Violation

Performance risks: every component interaction is slow. Scalability risks: server CPU wasted on recomputation.

---

## Rule: Use updating Property for Validation and Transformation

Use the updating[Property] hook to validate or transform a value before it is set on the property.

---

## Category

Framework Usage

---

## Rule

Define updating[Property]() to intercept, validate, or transform a value before it is assigned to the property. Return the modified value to override the input, or throw an exception to reject it.

---

## Reason

The updated hook fires AFTER the property is already set. If the value is invalid, the component is already in a bad state. updating fires before the assignment, allowing rejection or transformation of the incoming value before any side effects occur.

---

## Bad Example

`php
public function updatedSearch(): void
{
    // Search already set to raw value — too late to sanitize
    ->results = Post::search()->get();
}
`

---

## Good Example

`php
public function updatingSearch(): void
{
    ->search = strip_tags(); // Sanitize before setting
}

public function updatedSearch(): void
{
    ->results = Post::search(->search)->get();
}
`

---

## Exceptions

For simple validation that can be expressed in #[Rule] attributes, use alidateOnly() in updated() instead of manual checking in updating().

---

## Consequences Of Violation

Security risks: unsanitized values stored in properties before validation. Data integrity: invalid values may trigger downstream side effects before correction.

---

## Rule: Prevent Infinite Update Loops

Never mutate a property inside its own updated[Property] hook without a guard condition.

---

## Category

Reliability

---

## Rule

If an updated[Property]() hook changes the same property that triggered it, add a guard (counter, flag, or state check) to prevent re-entrant calls. Use $this->resetValidation() cautiously — it can also trigger re-entry.

---

## Reason

Changing a property inside its own updated hook triggers another updated call, which may trigger another property change, creating an infinite loop. This quickly exhausts PHP memory and crashes the component with a stack overflow or maximum execution time error.

---

## Bad Example

`php
public function updatedCount(): void
{
    ->count++; // Triggers updatedCount again — infinite loop
}
`

---

## Good Example

`php
protected bool  = false;

public function updatedCount(): void
{
    if (->isUpdating) return;
    ->isUpdating = true;
    ->count++; // Guard prevents re-entry
    ->isUpdating = false;
}
`

---

## Exceptions

If the second update is for a DIFFERENT property (e.g., updatedCountryId sets $this->cities), no loop occurs because updatedCities is a different hook. Ensure the second property's hook does not modify the first.

---

## Consequences Of Violation

Reliability risks: infinite loop crashes the component. Performance risks: unnoticed loops degrade response time.

---

## Rule: No Business Logic in Hooks

Never perform business logic (creating records, sending emails, calling external APIs) inside lifecycle hooks.

---

## Category

Architecture

---

## Rule

Restrict lifecycle hooks to validation, state preparation, and reactive side effects (dependent data refresh). Move record creation, email sending, payment processing, and external API calls to action methods.

---

## Reason

Lifecycle hooks execute in contexts where the developer may not expect them — during hydration, during initial render, during property updates. Business logic in hooks runs unpredictably and may execute multiple times, at unexpected times, or when the component state is not fully initialized. Action methods provide explicit, user-triggered execution.

---

## Bad Example

`php
public function updatedEmail(): void
{
    User::where('email', )->update(['newsletter_optin' => true]);
    // Side effect on every email keystroke — dangerous
}
`

---

## Good Example

`php
public function submitNewsletter(): void
{
    ->validate();
    User::where('email', ->email)->update(['newsletter_optin' => true]);
}
`

---

## Exceptions

Dispatching events for reactive UI updates (e.g., $dispatch('list-refreshed')) inside updated is acceptable because it affects only the frontend, not persistent data.

---

## Consequences Of Violation

Data integrity risks: business logic executes at unexpected times. Security risks: actions triggered without user intent.
