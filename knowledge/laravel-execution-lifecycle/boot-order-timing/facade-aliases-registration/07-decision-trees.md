# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Boot Order & Timing
**Knowledge Unit:** ku-05-facade-aliases-registration
**Generated:** 2026-06-03

---

# Decision Inventory

1. Facade Reference Strategy: Aliases vs explicit `use` imports
2. Custom Alias Registration: `config/app.php` aliases vs dynamic `AliasLoader` registration
3. Console Context: Facade import in console commands vs RegisterFacades addition

---

# Architecture-Level Decision Trees

---

## Decision Name: Facade Reference Strategy

---

## Decision Context

Choosing between using facade aliases (global class shortcuts registered via `RegisterFacades` bootstrapper) and explicit `use` imports for referencing facades in source files.

---

## Decision Criteria

* performance — alias registration adds ~0.5-2µs per alias via `class_alias()`
* architectural — aliases are registered by `RegisterFacades` bootstrapper (step 4 of 6); not available before
* security — alias collisions silently mask one facade with another
* maintainability — explicit imports make dependencies visible; aliases are implicit

---

## Decision Tree

Is the code in a console command?
↓
YES → Use explicit `use` imports — `RegisterFacades` bootstrapper is NOT in the Console Kernel's bootstrapper list
NO → Is the code in a context where `RegisterFacades` may not have run?
↓
YES → Use explicit `use` imports or `$app->make(Contract::class)` for safety
NO → Is explicit dependency declaration preferred for code clarity?
↓
YES → Use explicit `use` imports — `use Illuminate\Support\Facades\Cache` makes dependencies clear
NO → Is boilerplate reduction more important than explicit dependencies?
↓
YES → Use aliases — `Cache::get()` vs `use Illuminate\Support\Facades\Cache; Cache::get()`
NO → Default to explicit imports in business logic; aliases in blade templates and config files

---

## Rationale

Explicit `use` imports make class dependencies visible at the top of each file, enabling static analysis and IDE autocompletion. Aliases via `RegisterFacades` provide convenience but hide dependencies. In console commands, aliases are not available because `RegisterFacades` is excluded from the Console Kernel's bootstrapper list — requiring explicit imports.

---

## Recommended Default

**Default:** Explicit `use` imports in all PHP source files; aliases are acceptable in Blade templates and legacy code.
**Reason:** Explicit dependencies enable static analysis, avoid alias collisions, and work in all execution contexts.

---

## Risks Of Wrong Choice

- Using aliases in console commands: `Class "Cache" not found` — `RegisterFacades` is not in the Console Kernel bootstrapper list.
- Alias collision: two packages register the same alias (e.g., both provide `Cache`) — one silently overrides the other.
- Using aliases before `RegisterFacades` runs (in `register()` of a provider): alias not available — always use contract resolution.

---

## Related Rules

- Import facades explicitly in production code (05-rules.md, Rule 1)
- Never register aliases in service provider `register()` (05-rules.md, Rule 3)

---

## Related Skills

- Manage Facade Aliases Registration (06-skills.md)

---

## Decision Name: Custom Alias Registration Method

---

## Decision Context

Choosing between the `config/app.php` `aliases` array and dynamic `AliasLoader::alias()` calls for registering custom facade aliases.

---

## Decision Criteria

* performance — both use `class_alias()` — negligible
* architectural — `config/app.php` aliases are processed by `RegisterFacades` bootstrapper; dynamic aliases are manual
* security — dynamic registration after facade resolution may have no effect
* maintainability — `config/app.php` is the centralized registry; dynamic aliases are scattered

---

## Decision Tree

Is the alias for a static, well-known facade that should be globally available?
↓
YES → Register in `config/app.php` `aliases` array — centralized, cacheable, processed by `RegisterFacades` bootstrapper
NO → Is the alias conditionally registered based on runtime state?
↓
YES → Use `AliasLoader::getInstance()->alias('Name', Class::class)` in a provider's `boot()` method
NO → Is the alias for a third-party package that needs optional availability?
↓
YES → Register in `config/app.php` with a comment indicating package dependency
NO → Use `config/app.php` — the centralized and documented approach

---

## Rationale

The `aliases` array in `config/app.php` is the centralized registry for all facade aliases. It is processed by the `RegisterFacades` bootstrapper, which runs `class_alias()` for each entry. Dynamic alias registration via `AliasLoader` should be rare — for truly conditional aliases that cannot be declared statically.

---

## Recommended Default

**Default:** Register all facade aliases in `config/app.php` `aliases` array.
**Reason:** Centralized, visible, cacheable, processed by the framework's bootstrapper pipeline.

---

## Risks Of Wrong Choice

- Dynamic alias in provider `register()`: works but fragile — order-dependent and hard to discover.
- Dynamic alias after facade is already resolved: the alias takes effect but existing references to the old alias remain.
- Not checking alias uniqueness: accidental collision overrides another alias silently.

---

## Related Rules

- Place custom aliases at the end of the aliases array to avoid overriding framework aliases (05-rules.md, Rule 2)
- Never register aliases in service provider `register()` (05-rules.md, Rule 3)

---

## Related Skills

- Manage Facade Aliases Registration (06-skills.md)
