# ECC Anti-Patterns — Helper Functions

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Helper Functions |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Helper-Driven Development (Business Logic via Global Helpers)
2. Business Logic in Custom Helpers
3. `env()` Helper Outside Config Files
4. Missing `function_exists()` Guard on Custom Helpers

---

## Repository-Wide Anti-Patterns

- Overriding Core Helpers Without Understanding
- Helper as Service Locator (`app()` in every method)
- `dd()`/`dump()` Left in Production Code
- Generic Unprefixed Custom Helpers

---

## Anti-Pattern 1: Helper-Driven Development

### Category
Architecture | Testing

### Description
Building the entire application logic through global helper functions (`app()`, `cache()`, `resolve()`) instead of constructor injection. No class has explicit dependencies.

### Why It Happens
Helpful is the path of least resistance. Writing `app(UserRepository::class)->find($id)` is faster than adding a constructor parameter.

### Warning Signs
- Every service, action, and domain class calls `app()`, `resolve()`, or `cache()` in method bodies
- No constructor has more than 1-2 parameters
- Tests must boot the full Laravel container because every class resolves dependencies inline
- Refactoring a service name requires searching all `app('OldService')` calls

### Why It Is Harmful
Every `app()` call is an implicit dependency invisible in the class signature. Classes cannot be tested in isolation. The entire codebase is coupled to the global container. Refactoring requires grep-based searches instead of IDE refactoring.

### Preferred Alternative
Use constructor injection for all dependencies in services, actions, and domain objects. Reserve helpers for controllers, views, and closures.

### Related Rules
- Rule: Use Helpers in Controllers and Views, Injection in Services

---

## Anti-Pattern 2: Business Logic in Custom Helpers

### Category
Design | Testing

### Description
Defining complex business operations (payment processing, user registration, report generation) as global helper functions.

### Why It Happens
Developers extract repeated code into a helper for convenience without considering whether it belongs in a service class.

### Warning Signs
- Custom helper makes database queries or API calls
- Custom helper calls other helpers to orchestrate business logic
- Helper function has 50+ lines of code
- Helper cannot be mocked in tests

### Preferred Alternative
Keep helpers lightweight and pure (string formatting, data transformation). Extract business logic to dedicated service or action classes.

### Related Rules
- Rule: Keep Custom Helpers Lightweight and Side-Effect-Free

---

## Anti-Pattern 3: `env()` Helper Outside Config Files

### Category
Framework Usage

### Description
Calling `env('APP_DEBUG')` in controllers, services, or Blade views instead of `config('app.debug')`.

### Why It Happens
The developer tested in development (no config cache) where `env()` works fine.

### Warning Signs
- `env(` found outside `config/` directory
- Application works in development but certain features silently misbehave in production
- After `config:cache`, conditions based on env() are always false

### Preferred Alternative
Replace all `env()` calls in non-config files with `config('file.key')`. Ensure config files define the mapping.

### Related Rules
- Rule: Never Use env() Outside Config Files

---

## Anti-Pattern 4: Missing `function_exists()` Guard

### Category
Reliability

### Description
Defining `function str(string $string)` without guarding against prior definition.

### Why It Happens
Tutorials often omit the guard for brevity. Developers copy the pattern without understanding the risk.

### Warning Signs
- `function format_currency(...)` defined without `if (! function_exists('format_currency'))`
- Framework update causes fatal "Cannot redeclare function" errors
- Package installation breaks with function redefinition errors

### Preferred Alternative
Always wrap custom helpers in `if (! function_exists('name')) { ... }`.

### Related Rules
- Rule: Wrap Custom Helpers in function_exists() Guard
