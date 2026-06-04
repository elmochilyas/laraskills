# ECC Anti-Patterns — View Models and Presenters

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Blade / View Layer |
| **Knowledge Unit** | View Models and Presenters |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Business Logic in View Models (Side Effects on Render)
2. View Model for Every View (Premature Extraction)
3. Leaking View Models to API Responses (Blade Context Missing)
4. Constructor Explosion (4+ Parameters)
5. Mutable View Models (No Readonly, No Immutability)

---

## Repository-Wide Anti-Patterns

- Orphaned View Models (View Deleted, Class Remains)
- View Models with Static Factory Methods (HTTP Coupling)
- Presenter Pattern Coupled to Eloquent Models (Trait-Based)
- Global View Model Registration in Service Container
- View Models Calling `route()` or `auth()` in Constructor

---

## Anti-Pattern 1: Business Logic in View Models

### Category
Architecture | Security

### Description
Including write operations, state mutations, or business rule execution inside a view model — methods like `applyDiscount()`, `markAsViewed()`, or `processPayment()`.

### Why It Happens
Developers confuse "presentation logic" (formatting, computed values) with "business logic" (domain operations, state changes).

### Warning Signs
- View model calls `$this->order->update()` or `$this->order->save()`
- View model calls services that send emails, charge payments, or write to database
- `markAsViewed()` called in constructor — mutation on every render
- Debug toolbar shows writes originating from view model

### Preferred Alternative
Keep view models strictly to read-only formatting and computed values. Move business logic to services or actions called from controllers.

### Related Rules
- Rule: Never Include Business Logic in View Models

---

## Anti-Pattern 2: View Model for Every View

### Category
Maintainability

### Description
Creating a view model class for every view, including trivial templates that simply echo model properties like `{{ $user->name }}`.

### Why It Happens
Developers apply the view model pattern by default without considering whether the template's complexity justifies it.

### Warning Signs
- View model class has a constructor that only stores a model and exposes it directly
- Template uses `$viewModel->user->name` where `$user->name` would suffice
- 50+ view model classes but most have no computed properties or formatting
- Code review comments: "This view model just wraps a model — remove it"

### Preferred Alternative
Add a view model only when the template reaches a complexity threshold (multiple conditionals, formatting, null handling). For simple interpolation, pass the model directly.

### Related Rules
- Rule: Only Create View Models When Templates Exceed a Complexity Threshold

---

## Anti-Pattern 3: Leaking View Models to API Responses

### Category
Architecture | Reliability

### Description
Returning a view model's data as a JSON API response via `toArray()` or direct serialization, causing failures when view model methods call Blade-dependent helpers like `route()`.

### Why It Happens
Developers see view models and API Resources as interchangeable "data transformation" classes.

### Warning Signs
- View model has methods calling `route()`, `auth()`, `config()`
- Same view model class used in both `return view(...)` and `return response()->json(...)`
- API response fails in queue jobs or console commands
- `route()` throws `Symfony\Component\Routing\Exception\RouteNotFoundException` outside HTTP context

### Preferred Alternative
Use API Resources for JSON responses. Keep view models for Blade templates only.

### Related Rules
- Rule: Do Not Use View Models for API Responses

---

## Anti-Pattern 4: Constructor Explosion (4+ Parameters)

### Category
Maintainability

### Description
A view model constructor accepting 4+ distinct data sources (models, collections, config values), indicating the view does too much.

### Why It Happens
Developers keep adding parameters to an existing view model instead of splitting the view into smaller, focused components.

### Warning Signs
- Constructor has 5+ typed parameters
- Instantiating the view model requires gathering data from multiple sources
- View model tests require mocking many different inputs
- Adding a new feature means adding another constructor parameter

### Preferred Alternative
Limit to 3 parameters. Combine related data into a data object. Split the view into smaller components with their own focused view models.

### Related Rules
- Rule: Keep Constructor Parameters Focused — Maximum 3

---

## Anti-Pattern 5: Mutable View Models (No Readonly)

### Category
Design | Reliability

### Description
Declaring a view model class without `readonly`, allowing the template to accidentally mutate computed display values after construction.

### Why It Happens
Developers are not aware of PHP 8.1's `readonly` classes or don't consider immutability for presentation models.

### Warning Signs
- View model class has no `readonly` keyword
- Properties are `public` without `readonly`
- Template could potentially overwrite `$viewModel->formattedTotal` with bad data
- No compiler-level protection against mutation

### Preferred Alternative
Declare view models as `readonly class` with `readonly` properties computed eagerly in the constructor.

### Related Rules
- Rule: Use Readonly Properties for Eager-Computed Values
