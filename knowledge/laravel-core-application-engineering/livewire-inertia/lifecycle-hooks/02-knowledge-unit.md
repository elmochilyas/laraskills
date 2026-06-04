# Livewire Lifecycle Hooks

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Lifecycle Hooks
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Livewire's lifecycle hooks are methods that execute at specific points during a component's lifecycle: initialization (`mount`, `boot`), property updates (`updating`, `updated`), action execution (`before`, `after`), rendering (`rendering`, `rendered`), and dehydration (`dehydrate`). Each hook provides an interception point for cross-cutting concerns.

The engineering value is fine-grained control over component behavior. The `updating` hook can validate or transform values before they are set. The `boot` hook can initialize dependencies. The `hydrate`/`dehydrate` hooks can manage serialization. Understanding the execution order is essential for debugging complex component behavior.

---

## Core Concepts

### Hook Execution Order

```
1. boot()              — Runs on every request (initial + subsequent)
2. mount()             — Runs only on initial render (not on subsequent updates)
3. hydrate()           — After component is hydrated from serialized data
4. hydrate[property]() — After specific property is hydrated
5. booted()            — After component is fully initialized
6. updating[prop]()    — Before a property is updated
7. updated[prop]()     — After a property is updated
8. beforeAction()      — Before an action method executes
9. afterAction()       — After an action method executes
10. rendering()        — Before the view renders
11. rendered()         — After the view renders
12. dehydrate()        — Before component is serialized for response
```

### Hook Categories

| Category | Hooks | Purpose |
|---|---|---|
| Initialization | `boot`, `mount`, `booted` | Setup, data loading |
| Hydration | `hydrate`, `hydrate*` | Post-serialization setup |
| Property update | `updating`, `updating*`, `updated`, `updated*` | Validation, transformation |
| Action | `callBefore`, `callAfter` | Action interception |
| Rendering | `rendering`, `rendered` | View data preparation |
| Dehydration | `dehydrate`, `dehydrate*` | Serialization customization |

---

## Mental Models

### The Assembly Line

The lifecycle is like an assembly line. Each component passes through stations in order. At each station, a hook method can inspect, modify, or reject the component. Some stations only run on the first pass (mount). Others run on every pass (boot, updating, render).

### The Stage Play

`mount()` is the opening act — it sets up the stage (initial state). Each action is a scene change — `updating` adjusts props before the scene, `updated` adjusts after. `render` is the final bow — the audience sees the result.

---

## Internal Mechanics

### mount() vs boot()

`boot()` runs on every request (initial render AND subsequent AJAX updates). `mount()` runs only on the initial render. Use `mount()` for one-time initialization (loading initial data). Use `boot()` for per-request setup (shared dependencies).

### Hook for Specific Properties

`updatingSearch()` runs only when the `search` property is being updated:

```php
public function updatingSearch(string $value): void
{
    // Validate or transform search value before it's set
    $this->search = strip_tags($value);
}
```

### Hydration Flow

```
Initial render: boot() → mount() → booted() → rendering() → render() → rendered() → dehydrate()
Subsequent update: boot() → hydrate() → booted() → updating*() → updated*() → callBefore() → action() → callAfter() → rendering() → render() → rendered() → dehydrate()
```

---

## Patterns

### Initial Data Loading

Load data on initial render only:

```php
class UserDashboard extends Component
{
    public User $user;
    public array $stats = [];

    public function mount(): void
    {
        // Only runs once — on initial page load
        $this->stats = Cache::remember('dashboard:stats', 3600, function () {
            return [
                'users' => User::count(),
                'orders' => Order::count(),
            ];
        });
    }
}
```

### Property Validation Before Set

Validate before a property is updated:

```php
public function updatingAge(int $value): void
{
    if ($value < 0 || $value > 150) {
        $this->addError('age', 'Age must be between 0 and 150.');
        return false; // Prevents the update
    }
}
```

Returning `false` from `updating*()` prevents the property from being updated.

### Reset State After Actions

Reset specific properties after an action:

```php
public function save(): void
{
    $this->validate();
    Post::create($this->only(['title', 'body']));
}

public function updatedSave(): void
{
    // Reset form after save action
    $this->reset('title', 'body');
}
```

### Rendering Hooks for View Data

Prepare view data before rendering:

```php
public function rendering(View $view): void
{
    // Add extra data to the view
    $view->with('extraData', $this->computeExtraData());
}
```

---

## Architectural Decisions

### mount() vs Constructor

| Concern | Constructor | mount() |
|---|---|---|
| Execution | On every hydration | Initial render only |
| Dependency injection | Full (container) | Full (Livewire injects) |
| Eloquent model access | Not available | Available (route binding) |
| Property initialization | Before mount | After property initial values |

Use `mount()` for initialization. Use constructor only for dependency injection.

### updating* vs rules array

| Concern | updating*() | $rules array |
|---|---|---|
| Validation scope | Per-property | All properties |
| Transformation | Yes (modify value) | No (reject only) |
| Execution time | Before set | Before persist |
| Code organization | Per-property method | Centralized array |

Use `updating*()` for transformations and per-property validation. Use `$rules` for bulk validation.

---

## Tradeoffs

| Concern | Lifecycle Hook | Inline Logic |
|---|---|---|
| Separation | Centralized hook methods | Scattered in actions |
| Reusability | Cross-action (updating* runs for all changes) | Per-action |
| Readability | Clear intent (updatingSearch) | Mixed with action logic |
| Debuggability | Stack trace includes hook name | Stack trace in action |

---

## Performance Considerations

Hooks add method call overhead per lifecycle event. For typical components (3-5 hooks), overhead is under 0.01ms. Expensive operations in hooks (database queries, API calls) should be cached.

---

## Production Considerations

### Keep mount() Fast

`mount()` blocks the initial render. Avoid expensive queries in `mount()` — use lazy loading or defer to a sub-component.

### Don't Override Constructor Directly

Livewire requires the constructor argument signature for hydration. Overriding the constructor breaks hydration. Use `boot()` for per-request initialization that cannot go in `mount()`.

### Use dehydrate for Serialization

The `dehydrate()` hook modifies the serialized component snapshot:

```php
public function dehydrate(): void
{
    // Remove sensitive data from serialization
    unset($this->temporaryToken);
}
```

---

## Common Mistakes

### Confusing boot() and mount()

`boot()` runs on every AJAX request. If you load users in `boot()`, they are reloaded on every interaction. Use `mount()` for one-time data loading.

### Return false in updating*

Returning `false` from `updating*()` prevents the update. This is the only way to cancel a property update before it happens.

### Side Effects in rendered()

`rendered()` runs after every render. Side effects (dispatching events, modifying session) in `rendered()` can cause infinite loops if they trigger another render.

---

## Failure Modes

### Hook Order Dependencies

If `updatedSearch()` depends on data set in `updatedFilter()`, the order of property updates matters. Livewire updates properties in the order they appear in the request.

### Exception in dehydrate

An exception in `dehydrate()` prevents the component from serializing, breaking the response. Keep `dehydrate()` simple — no database queries or external calls.

---

## Ecosystem Usage

Lifecycle hooks are built into Livewire's component system and require no additional packages. They integrate with Laravel's validation, caching, and session systems. The hooks pattern is consistent with other PHP lifecycle frameworks and similar to Vue.js lifecycle hooks for developers familiar with both ecosystems.

## Related Knowledge Units

- **Component Architecture** (this workspace) — component lifecycle
- **Data Binding** (this workspace) — property update hooks
- **Actions and Events** (this workspace) — action lifecycle hooks
- **Testing** (this workspace) — testing hook behavior

---

## Research Notes

- Lifecycle hooks are defined as methods on the component class — no registration needed
- `hydrate*()` and `dehydrate*()` accept specific property names (e.g., `hydrateSearch()`)
- Returning `false` from `updating*()` prevents the update — this is the only cancellation mechanism
- Livewire v3 added `rendering()` and `rendered()` hooks (not present in v2)
