# Livewire Component Architecture — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Component Architecture |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. God Component — Monolithic 500-Line Component
2. Untyped Public Properties
3. Missing #[Computed] for Expensive Derived Properties
4. Controller Logic in Livewire Component
5. Sensitive State Not Marked #[Volatile]

---

## Repository-Wide Anti-Patterns

- **No separation of concerns**: Database queries mixed with rendering logic in the same method.
- **Too many nested components**: Deep component hierarchy causing performance overhead.
- **Inline string rendering**: Returning a string from `render()` instead of a View instance.
- **Case mismatch in Blade references**: Using PascalCase in Blade tags where kebab-case is expected.

---

## Anti-Pattern 1: God Component — Monolithic 500-Line Component

### Category

Architecture

### Description

Creating a single Livewire component that handles an entire page or multiple concerns, exceeding 300 lines with 20+ properties and 15+ actions.

### Why It Happens

It's easier to add one more property and one more method to an existing component than to create a new component file and wire it up. Over time, a 50-line component grows to 500 lines without a conscious decision to split.

### Warning Signs

- Component class exceeds 300 lines
- Component template exceeds 400 lines
- Component handles forms, tables, charts, filters, and navigation in one class
- Multiple unrelated properties (search text, selected user, chart type, sort order) in the same component
- Difficult to find specific logic within the class

### Why Harmful

Large monolithic components (500+ lines, 20+ properties, 15+ actions) are hard to understand, test, and maintain. They mix multiple concerns in a single class — search logic, form handling, event dispatching, data fetching. Extracting sub-components isolates each concern, enables independent testing, and improves reusability.

### Consequences

- Hard to understand — reader must parse 500+ lines to understand the component
- Hard to test — must set up every dependency to test one feature
- No reusability — business logic embedded in the component cannot be reused elsewhere
- Merge conflicts — multiple developers touching the same file
- Performance — large hydration payloads on every interaction

### Alternative

Split components at natural boundaries: one component per form, per table, per widget, per page section. If a component's template exceeds 200 lines or its class exceeds 150 lines, extract sub-components.

### Refactoring Strategy

1. Identify distinct UI sections in the component (form, table, filters, stats)
2. Extract each section into its own Livewire component with a focused class
3. The parent component becomes a container that composes sub-components
4. Use `$dispatch()` for cross-component communication
5. Verify each extracted component is independently testable

### Detection Checklist

- [ ] No component class exceeds 200 lines
- [ ] No component template exceeds 250 lines
- [ ] Components map 1:1 to UI widgets or sections
- [ ] Each component has a single responsibility
- [ ] Sub-components are reusable across pages where applicable

### Related Rules

- One Component Per Concern (05-rules.md)

### Related Skills

- Create a Well-Structured Livewire Component (06-skills.md)

### Related Decision Trees

- Single Monolithic Component vs Multiple Small Components (07-decision-trees.md)

---

## Anti-Pattern 2: Untyped Public Properties

### Category

Maintainability

### Description

Declaring public properties in Livewire components without PHP 8+ type declarations (e.g., `public $name;` instead of `public string $name = '';`).

### Why It Happens

Older PHP conventions used untyped properties. Developers may not be aware of PHP 8+ type syntax or may view type declarations as optional.

### Warning Signs

- `public $name;` — no type, no default
- `public $count = 0;` — no type, default implies type but PHP doesn't enforce it
- Properties accepting unexpected types from the frontend without error
- Runtime errors from assuming a type (calling string methods on an array, etc.)

### Why Harmful

Untyped public properties accept any value from the frontend — a string where an integer is expected, null where a string is expected, an array where an object is expected. Without types, Livewire silently accepts incorrect types, leading to subtle bugs. Typed properties enforce data integrity at the PHP level.

### Consequences

- Incorrect types silently accepted — downstream errors
- Runtime crashes from type mismatches
- Security issues from type coercion (string "0" treated as falsy, etc.)
- Harder to understand expected property values

### Alternative

Add an explicit type declaration to every public property using PHP 8+ typed properties syntax.

### Refactoring Strategy

1. Search for untyped public properties in all Livewire components
2. Add type declarations based on the expected value type
3. Add default values that match the declared type
4. For nullable properties, use `?Type` and set default to `null`

### Detection Checklist

- [ ] Every public property has a PHP type declaration
- [ ] Default values match the declared types
- [ ] Nullable properties use `?Type` syntax
- [ ] Enum or backed enum types used for constrained values
- [ ] TypeScript types on the frontend match PHP types

### Related Rules

- Type All Public Properties (05-rules.md)

### Related Skills

- Create a Well-Structured Livewire Component (06-skills.md)

### Related Decision Trees

- Livewire Component vs Blade + Alpine.js Hybrid (07-decision-trees.md)

---

## Anti-Pattern 3: Missing #[Computed] for Expensive Derived Properties

### Category

Performance

### Description

Defining methods on the component class that perform expensive computations or database queries without the `#[Computed]` attribute, causing them to re-execute on every access.

### Why It Happens

Without `#[Computed]`, the method works correctly — it just runs every time it's called. If the template calls it in multiple places, the same query runs multiple times. The performance impact is invisible until the database load becomes a problem.

### Warning Signs

- Same database query appears multiple times in a single request's log
- Template accesses `$this->recentOrders()` in multiple places
- Slow renders despite simple templates
- No `#[Computed]` attribute on methods that query the database

### Why Harmful

Without `#[Computed]`, every call to a derived property re-executes the computation. If the template calls the same derived data in multiple places, the query runs multiple times per request. This multiplies database load and response time unnecessarily.

### Consequences

- Repeated database queries in a single request — wasted resources
- Slower component rendering
- Increased database load
- Scalability issues under concurrent users

### Alternative

Apply `#[Computed]` to methods that perform expensive computations or database queries. This caches the result after the first call within the same request lifecycle.

### Refactoring Strategy

1. Identify methods that query the database or perform expensive computations
2. Add `#[Computed]` attribute to each method
3. For methods that should recompute under certain conditions, use `#[Computed(persist: false)]` or clear the computed cache as needed
4. Verify that repeated template access only triggers one query

### Detection Checklist

- [ ] All DB-querying methods use `#[Computed]`
- [ ] No duplicate queries in a single request
- [ ] Computed properties are properly invalidated when dependencies change
- [ ] Simple getters (string formatting) do not use `#[Computed]` (unnecessary overhead)

### Related Rules

- Use Computed for Expensive Derived Properties (05-rules.md)

### Related Skills

- Create a Well-Structured Livewire Component (06-skills.md)

### Related Decision Trees

- Full-Page Component vs Nested Component (Island) Architecture (07-decision-trees.md)

---

## Anti-Pattern 4: Controller Logic in Livewire Component

### Category

Architecture

### Description

Embedding controller-level business logic (complex validation workflows, multi-step operations, external service coordination) directly in Livewire component classes instead of extracting them to service classes.

### Why It Happens

Livewire components are the natural home for interactive behavior. As features grow, business logic is added directly to component methods. The component starts as a "view" but becomes a "controller + service + view" all in one.

### Warning Signs

- Component methods exceeding 50 lines with business logic
- Multiple service dependencies injected into the component
- The same business logic appears in multiple components
- Business logic cannot be tested without mounting the full Livewire component
- Component class imports services, repositories, and external clients directly

### Why Harmful

Components with embedded business logic violate separation of concerns. The logic cannot be reused across multiple components, cannot be tested without Livewire's mounting infrastructure, and becomes tightly coupled to the component's rendering concerns.

### Consequences

- Business logic not reusable — must be duplicated for CLI commands, API endpoints, queue jobs
- Hard to test — must mount Livewire component to test business logic
- Component class grows beyond maintainable size
- Tight coupling between presentation and business logic
- Refactoring business logic requires changing component tests

### Alternative

Extract business logic into dedicated service classes (e.g., `CheckoutService`, `UserRegistrationService`). Keep the component focused on presentation, validation, and event dispatching.

### Refactoring Strategy

1. Identify business logic in component methods (multi-step operations, calculations, external service calls)
2. Extract each distinct operation into a service class
3. Inject the service into the component via constructor or `boot()` method
4. The component method delegates to the service: validate -> authorize -> service.execute() -> dispatch -> flash

### Detection Checklist

- [ ] Component methods are under 30 lines
- [ ] Business logic is in service classes, not component methods
- [ ] Services are tested independently without Livewire mounting
- [ ] Services are reusable across controllers, commands, and jobs
- [ ] Component focuses on presentation, state, and event wiring

### Related Rules

- One Component Per Concern (05-rules.md)

### Related Skills

- Create a Well-Structured Livewire Component (06-skills.md)

### Related Decision Trees

- Livewire Component vs Blade + Alpine.js Hybrid (07-decision-trees.md)

---

## Anti-Pattern 5: Sensitive State Not Marked #[Volatile]

### Category

Security

### Description

Storing sensitive data (API keys, tokens, internal IDs, passwords) in public properties without marking them with `#[Volatile]`, causing them to be serialized in the HTML snapshot visible to the client.

### Why It Happens

Developers may store sensitive values in public properties for convenience during development and forget to mark them as volatile before deployment.

### Warning Signs

- API keys, tokens, or passwords visible in the Livewire component snapshot (HTML source)
- `#[Volatile]` attribute absent on properties that store sensitive data
- Public properties holding values that should never reach the browser
- Configuration or environment values stored in component properties

### Why Harmful

Livewire serializes all public properties in the component snapshot, which is embedded in the HTML source. Without `#[Volatile]`, sensitive data is sent to every client that renders the component. This data is visible to anyone who inspects the page source or network tab.

### Consequences

- API keys and tokens exposed to all users
- Password hashes or secrets leaked
- Internal system details exposed
- Security incidents requiring key rotation and incident response

### Alternative

Mark any public property that contains sensitive data with the `#[Volatile]` attribute. Volatile properties are not serialized in the snapshot and are reset to their default values on every request.

### Refactoring Strategy

1. Audit all public properties in all Livewire components for sensitive data
2. Add `#[Volatile]` to any property that stores secrets, tokens, or sensitive values
3. For data that must be available but not persisted, use a private property or fetch it on demand
4. Verify in the browser's page source that sensitive data no longer appears in the snapshot

### Detection Checklist

- [ ] No API keys in public properties without `#[Volatile]`
- [ ] No tokens or secrets visible in the component snapshot
- [ ] All sensitive properties marked `#[Volatile]`
- [ ] Volatile properties are properly initialized in `mount()` or `boot()`
- [ ] Component snapshot inspection shows no sensitive data

### Related Rules

- Type All Public Properties (05-rules.md)

### Related Skills

- Create a Well-Structured Livewire Component (06-skills.md)

### Related Decision Trees

- Full-Page Component vs Nested Component (Island) Architecture (07-decision-trees.md)
