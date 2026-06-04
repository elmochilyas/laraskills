# Livewire Lifecycle Hooks — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Lifecycle Hooks |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Business Logic in Lifecycle Hooks
2. Infinite Update Loop in updated Hook
3. Heavy Database Queries in boot()
4. Using mount() for Per-Request Data
5. Authorization in Lifecycle Hooks

---

## Repository-Wide Anti-Patterns

- **Side effects in rendering()/rendered()**: Database writes during component render — hard to trace, duplicates on re-render.
- **Mutating properties in dehydrate()**: Changing state after render — inconsistent snapshot.
- **Expensive operations in hydrate()**: Database queries on every AJAX update — slow responses.
- **Lifecycle hooks over 50 lines**: Single hook doing too much — should be extracted to services.

---

## Anti-Pattern 1: Business Logic in Lifecycle Hooks

### Category

Architecture

### Description

Performing business logic (creating records, sending emails, calling external APIs, processing payments) inside lifecycle hooks like `mount()`, `updated()`, or `boot()`.

### Why It Happens

It's tempting to use `updated()` for convenience — "when the user changes this dropdown, automatically update that record." The hook is right there with access to component state, making it seem like the natural place.

### Warning Signs

- `updated()` hook creates database records or sends emails
- `mount()` calls external APIs or payment gateways
- `boot()` dispatches jobs or triggers workflows
- Side effects happen automatically when the developer didn't expect them

### Why Harmful

Lifecycle hooks execute in contexts where the developer may not expect them: during hydration, during initial render, during property updates triggered by events. Business logic in hooks runs unpredictably and may execute multiple times, at unexpected times, or when the component state is not fully initialized. Action methods provide explicit, user-triggered execution with clear intent.

### Consequences

- Business logic executes at unexpected times — during hydration, event propagation, or initialization
- Records created or emails sent as side effects of simple property changes
- Duplicate execution — same logic runs on initial render and subsequent AJAX updates
- Hard to debug — no clear trigger for the side effect

### Alternative

Restrict lifecycle hooks to validation, state preparation, and reactive side effects (dependent data refresh). Move record creation, email sending, payment processing, and external API calls to action methods.

### Refactoring Strategy

1. Audit all lifecycle hooks for business logic (DB writes, API calls, email sends)
2. Extract each instance into a dedicated action method
3. Call the action method explicitly from the UI (button click, form submit)
4. Verify that business logic no longer runs as an automatic side effect

### Detection Checklist

- [ ] No lifecycle hook creates database records
- [ ] No lifecycle hook sends emails or dispatches notifications
- [ ] No lifecycle hook calls external APIs or payment gateways
- [ ] All business logic resides in action methods
- [ ] Side effects in hooks are limited to state preparation and data refresh

### Related Rules

- No Business Logic in Hooks (05-rules.md)

### Related Skills

- Use Lifecycle Hooks Effectively in Livewire Components (06-skills.md)

### Related Decision Trees

- Lifecycle Hook vs Dedicated Action Method for Side Effects (07-decision-trees.md)

---

## Anti-Pattern 2: Infinite Update Loop in updated Hook

### Category

Reliability

### Description

Mutating a property inside its own `updated[Property]()` hook without a guard condition, causing an infinite loop that crashes the component.

### Why It Happens

The pattern seems straightforward: "when count changes, increment it." The developer doesn't realize that changing the same property inside `updatedCount()` triggers another `updatedCount()` call.

### Warning Signs

- `updatedCount()` calls `$this->count++`
- `updatedSearch()` modifies `$this->search`
- Component crashes with maximum execution time error
- Browser tab hangs on a simple property change
- PHP error: "Maximum execution time of 30 seconds exceeded"

### Why Harmful

Changing a property inside its own `updated` hook triggers another `updated` call, which may trigger another property change, creating an infinite loop. This quickly exhausts PHP memory and crashes the component with a stack overflow or maximum execution time error. The component becomes completely unusable.

### Consequences

- Infinite loop — component crashes with max execution time error
- Component becomes completely unusable
- Browser tab may hang from repeated failed AJAX requests
- Hard to debug — the loop is invisible in the template

### Alternative

Add a guard condition (boolean flag, counter, or state check) to prevent re-entrant calls when modifying a property inside its own `updated` hook.

### Refactoring Strategy

1. Identify `updated` hooks that modify the same property
2. Add a guard: `protected bool $isUpdating = false;`
3. Check and set the guard at the start: `if ($this->isUpdating) return; $this->isUpdating = true;`
4. Reset the guard after the logic: `$this->isUpdating = false;`

### Detection Checklist

- [ ] No `updated` hook modifies the same property without a guard
- [ ] Guards use boolean flags, not fragile counters
- [ ] If `updated[PropertyA]` modifies `PropertyB`, `updated[PropertyB]` does not modify `PropertyA`
- [ ] No infinite loop crashes in test or production

### Related Rules

- Prevent Infinite Update Loops (05-rules.md)

### Related Skills

- Use Lifecycle Hooks Effectively in Livewire Components (06-skills.md)

### Related Decision Trees

- updating vs updated for Property Validation/Transformation (07-decision-trees.md)

---

## Anti-Pattern 3: Heavy Database Queries in boot()

### Category

Performance

### Description

Performing slow database queries, report generation, or API calls inside the `boot()` method, which runs on EVERY request including subsequent AJAX updates.

### Why It Happens

Developers may not distinguish between `mount()` (one-time) and `boot()` (every request). They put initialization logic in `boot()` because "it always runs," not realizing the performance cost.

### Warning Signs

- `boot()` contains `::all()`, `::count()`, `::sum()`, or `Report::generate()`
- `boot()` makes HTTP requests to external services
- Every component interaction is slow (100ms+ latency on every click)
- Network tab shows long response times for even simple actions

### Why Harmful

`boot()` runs on EVERY request — initial render AND every subsequent AJAX update. A 200ms database query in `boot()` adds 200ms to every single component interaction. For a form with 10 fields that each trigger `updated()` hooks, the cumulative delay is 2 seconds of unnecessary overhead. This makes the component feel sluggish for every user action.

### Consequences

- Slow response times for every component interaction
- 200ms+ latency on every button click and keystroke
- Server CPU wasted on unnecessary recomputation
- Poor user experience — every action feels delayed

### Alternative

Keep `boot()` lightweight (sub-millisecond setup only). Move expensive operations to `mount()` (if one-time), action methods (if user-triggered), or `#[Lazy]` components (if below the fold).

### Refactoring Strategy

1. Audit all `boot()` methods for queries, API calls, or heavy computations
2. Move one-time data loading to `mount()`
3. Move user-triggered operations to action methods
4. Move deferred operations to `#[Lazy]` components
5. Verify `boot()` contains only lightweight setup (property defaults, service container resolution)

### Detection Checklist

- [ ] `boot()` contains no database queries
- [ ] `boot()` contains no API calls
- [ ] `boot()` completes in under 5ms
- [ ] One-time initialization is in `mount()`, not `boot()`
- [ ] User-triggered operations are in action methods

### Related Rules

- Keep Lifecycle Hooks Lightweight (05-rules.md)

### Related Skills

- Use Lifecycle Hooks Effectively in Livewire Components (06-skills.md)

### Related Decision Trees

- mount() vs boot() for Data Initialization (07-decision-trees.md)

---

## Anti-Pattern 4: Using mount() for Per-Request Data

### Category

Reliability

### Description

Loading data that must be fresh on every request (notifications, unread counts, real-time stats) inside `mount()` instead of `boot()`.

### Why It Happens

Developers may not understand the lifecycle difference between `mount()` (one-time) and `boot()` (every request). They follow the "initialize in mount" pattern from other frameworks.

### Warning Signs

- Notifications count loaded in `mount()` — stays stale after user reads a notification
- Unread badge shows incorrect count after component updates
- `mount()` loads data that changes between requests (session-based, time-sensitive)
- No `boot()` method defined — all initialization in `mount()`

### Why Harmful

`mount()` runs only once — when the component is first created and rendered. On subsequent AJAX updates (actions, property changes), `mount()` does NOT run. Data loaded in `mount()` becomes stale. A notification count loaded in `mount()` shows the count from page load, not the current count after the user reads notifications via another action.

### Consequences

- Stale data displayed to user after component interactions
- Notification badges show incorrect counts
- Real-time data never updates without a full page refresh
- Users see outdated information and lose trust

### Alternative

Use `boot()` for data that must be fresh on every request. Use `mount()` only for one-time initialization (data that never changes during the component's lifetime).

### Refactoring Strategy

1. Identify data loaded in `mount()` that should be fresh on every request
2. Move to `boot()` — runs on initial render and every AJAX update
3. Keep truly static data (user object, post by ID) in `mount()`
4. Verify that dynamic data updates correctly after component interactions

### Detection Checklist

- [ ] `mount()` used only for one-time initialization
- [ ] Data that changes between requests loaded in `boot()`
- [ ] Notification counts, timestamps, and session-based data are fresh on every request
- [ ] No stale data visible after component interactions

### Related Rules

- Use mount for One-Time Initialization (05-rules.md)

### Related Skills

- Use Lifecycle Hooks Effectively in Livewire Components (06-skills.md)

### Related Decision Trees

- mount() vs boot() for Data Initialization (07-decision-trees.md)

---

## Anti-Pattern 5: Authorization in Lifecycle Hooks

### Category

Security

### Description

Performing access control checks (Gates, Policies, role checks) inside lifecycle hooks like `mount()`, `boot()`, or `updated()` instead of in action methods or middleware.

### Why It Happens

Developers may gate the component by checking authorization in `mount()`: "if the user can't view this, redirect or show an error." This works for initial page load but misses subsequent AJAX actions.

### Warning Signs

- `$this->authorize()` or `Gate::allows()` in `mount()` or `boot()`
- Authorization check runs on component initialization but not on individual actions
- User can access unauthorized data by calling actions directly via JavaScript
- No authorization checks in action methods

### Why Harmful

Authorization in lifecycle hooks runs only during those hooks' specific phases. An authorization check in `mount()` runs only on initial render — on subsequent AJAX updates (actions, property changes), `mount()` doesn't run. A user could call an action method directly via AJAX after the initial authorization passed, bypassing the check entirely.

### Consequences

- Authorization check runs only on initial page load
- Subsequent action calls bypass the check entirely
- Unauthorized users can perform protected actions
- Security vulnerability — actions accessible without authorization verification

### Alternative

Perform authorization checks inside action methods using `$this->authorize()`, or use Laravel middleware for route-level protection. Lifecycle hooks should not be relied upon for access control.

### Refactoring Strategy

1. Identify all authorization checks in lifecycle hooks
2. Move each check into the corresponding action method
3. Use `$this->authorize('action', $model)` or `Gate::allows()` in each action
4. If all actions in a component need the same auth, use middleware on the route instead

### Detection Checklist

- [ ] Authorization checks are in action methods, not lifecycle hooks
- [ ] Every action that modifies data has an authorization check
- [ ] No auth checks in `mount()`, `boot()`, or `updated()` hooks
- [ ] Unauthorized users are correctly rejected when calling actions directly

### Related Rules

- Keep Lifecycle Hooks Lightweight (05-rules.md)

### Related Skills

- Use Lifecycle Hooks Effectively in Livewire Components (06-skills.md)

### Related Decision Trees

- Lifecycle Hook vs Dedicated Action Method for Side Effects (07-decision-trees.md)
