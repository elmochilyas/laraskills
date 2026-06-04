# ECC Anti-Patterns — Facade Aliases Registration

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Boot Order & Timing |
| **Knowledge Unit** | Facade Aliases Registration |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using Facades Before `RegisterFacades` Bootstrapper
2. Relying on Facade Aliases in Console Commands
3. Dynamic Alias Registration via `class_alias()` Instead of Config
4. Alias Collision Without Namespace Prefixing

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — facades in business logic hide the dependency chain.

---

## Anti-Pattern 1: Using Facades Before `RegisterFacades` Bootstrapper

### Category
Framework Usage

### Description
Using facades (e.g., `Cache::get()`, `DB::table()`) before the `RegisterFacades` bootstrapper has executed. Facade aliases are registered during step 4 of 6 in the bootstrapper sequence.

### Why It Happens
Developers assume facades are available immediately after Application construction because they work in most application code. They don't realize the `RegisterFacades` bootstrapper is required.

### Warning Signs
- `Cache::get()` or similar facade calls in a bootstrapper that runs before step 4
- Facade calls in `bootstrap/app.php`
- `Class 'Cache' not found` errors during early bootstrap

### Why It Is Harmful
The `class_alias()` registration has not occurred yet. Using the facade class name triggers a class-not-found error because the autoloader doesn't know about the alias.

### Real-World Consequences
A developer adds `Log::info('Bootstrap started')` inside the `LoadEnvironmentVariables` bootstrapper for debugging. The `Log` facade alias hasn't been registered yet. The application crashes with `Class "Log" not found` before any real error handling is active.

### Preferred Alternative
Use the full namespace class name or the underlying contract/class directly before the `RegisterFacades` bootstrapper runs. Use facades only after all bootstrappers complete.

### Refactoring Strategy
1. Find facade calls before `RegisterFacades` bootstrapper
2. Replace with `$app->make('log')` or the underlying class
3. Move facade-dependent code to `boot()` methods or later

### Detection Checklist
- [ ] Facade calls in bootstrapper code
- [ ] Facade calls in `bootstrap/app.php`
- [ ] `Class 'FacadeName' not found` early in bootstrap

### Related Rules
Rule 1 (05-rules.md): Facade aliases are not available before `RegisterFacades` bootstrapper runs.

### Related Skills
Register and Verify Facade Aliases (06-skills.md).

### Related Decision Trees
Facade Availability Timing decision (07-decision-trees.md).

---

## Anti-Pattern 2: Relying on Facade Aliases in Console Commands

### Category
Framework Usage

### Description
Using facade class aliases (short names like `Cache`, `DB`) in console command code without explicit `use` imports. The Console kernel does not include `RegisterFacades` in its bootstrapper list.

### Why It Happens
Developers write console commands using facades by short name because it works in HTTP context. They don't realize the console bootstrapper set differs.

### Warning Signs
- Console commands use `Cache::` or `DB::` without `use` import
- "Class not found" errors in console commands only
- Commands work in HTTP context but fail when run via `artisan`

### Why It Is Harmful
The Console Kernel does NOT run `RegisterFacades`. Facade aliases are not registered for console commands. The short class name cannot be autoloaded, causing fatal errors.

### Real-World Consequences
An Artisan command uses `Log::info('Processing...')` without importing the `Log` facade. The command runs fine locally (with some autoloader configurations) but fails in production with `Class "Log" not found`. Background job processing stops entirely.

### Preferred Alternative
Always import facades with explicit `use` statements in console command files: `use Illuminate\Support\Facades\Log`. Better yet, use constructor injection for console commands.

### Refactoring Strategy
1. Find facade short-name usage in console command files
2. Add explicit `use` statements for each facade
3. Consider refactoring to use dependency injection instead of facades

### Detection Checklist
- [ ] Facades used in console commands without `use` import
- [ ] "Class not found" errors only during `artisan` execution
- [ ] Commands work in web context but fail in console

### Related Rules
Rule 2 (05-rules.md): Always import facades explicitly in console commands — the Console Kernel does not register facade aliases.

### Related Skills
Register and Verify Facade Aliases (06-skills.md).

### Related Decision Trees
Console vs HTTP Boot Differences decision (07-decision-trees.md).

---

## Anti-Pattern 3: Dynamic Alias Registration via `class_alias()` Instead of Config

### Category
Maintainability

### Description
Calling `class_alias()` directly or using `AliasLoader::getInstance()->alias()` instead of listing the alias in the `aliases` array in `config/app.php`.

### Why It Happens
Developers need to register an alias dynamically and discover `AliasLoader` directly. They don't realize the `config/app.php` aliases array is the proper configuration point.

### Warning Signs
- `class_alias()` called in application code for facade aliases
- `AliasLoader::getInstance()->alias()` used outside of service providers
- Aliases registered in `boot()` via non-config mechanisms

### Why It Is Harmful
Aliases registered via `class_alias()` are not tracked in the configuration. They cannot be cached, inspected, or managed uniformly. Different environments may have different alias sets.

### Real-World Consequences
A package registers an alias via `AliasLoader::getInstance()->alias('MyAlias', MyClass::class)` in its service provider. A newer version of the package changes the alias name but forgets to update the `class_alias()` call. The old alias persists alongside the new one, causing ambiguous class references.

### Preferred Alternative
List all aliases in the `aliases` array of `config/app.php`. Use `AliasLoader::getInstance()->alias()` only for truly dynamic aliases that cannot be known at configuration time.

### Refactoring Strategy
1. Find all `class_alias()` and `AliasLoader::getInstance()->alias()` calls
2. Move static aliases to `config/app.php` aliases array
3. Keep `AliasLoader::getInstance()->alias()` only for truly dynamic use cases

### Detection Checklist
- [ ] `class_alias()` called directly in application code
- [ ] `AliasLoader::getInstance()->alias()` used outside of very specific dynamic scenarios
- [ ] Alias configuration spread across multiple files

### Related Rules
Rule 3 (05-rules.md): Register aliases via `config/app.php` aliases array — avoid `class_alias()` in application code.

### Related Skills
Register and Verify Facade Aliases (06-skills.md).

---

## Anti-Pattern 4: Alias Collision Without Namespace Prefixing

### Category
Reliability

### Description
Registering aliases with short, generic names that collide with existing core aliases or other package aliases. Using `'analytics'` instead of `'acme-analytics'`.

### Why It Happens
Developers choose short, memorable alias names without checking for collisions with the ~70 core aliases or other package aliases.

### Warning Signs
- Custom alias has a generic name like `'email'`, `'payment'`, `'search'`
- After adding a custom alias, a different service returns unexpected results
- `$app->bound('email')` returns true but resolves to the wrong class

### Why It Is Harmful
Alias collisions are silent — the last registration wins with no warning. A generic alias name may shadow a core alias or be shadowed by another package, causing unpredictable resolution behavior.

### Real-World Consequences
A package registers an alias `'mail'` pointing to its custom mailer. This shadows the core `'mail'` alias used by Laravel's mail system. All `Mail::send()` calls now use the wrong implementation. Emails silently fail to send.

### Preferred Alternative
Prefix all custom aliases with a unique package or application identifier: `'acme-mail'`, `'myapp-payment'`. Check `$app->bound()` before registering to detect collisions intentionally.

### Refactoring Strategy
1. Find all custom aliases with generic names
2. Rename with a unique prefix (package name or app abbreviation)
3. Update all references to the new alias name

### Detection Checklist
- [ ] Custom alias with name matching a core alias key
- [ ] Generic alias name without prefix
- [ ] Resolution behavior changed after adding a new alias

### Related Rules
Rule 4 (05-rules.md): Prefix custom aliases to avoid collision with core aliases.

### Related Skills
Register and Verify Facade Aliases (06-skills.md).

### Related Decision Trees
Custom Alias Key Collision decision (07-decision-trees.md).
