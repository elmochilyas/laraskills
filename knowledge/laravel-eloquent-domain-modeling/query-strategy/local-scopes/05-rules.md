# Phase 5: Rules — Local Scopes

## Rule 1: Always Explicitly `return $q` from Scope Methods
---
## Category
Reliability
---
## Rule
Write an explicit `return $q` statement as the last line of every scope method. Never rely on the implicit `$this` return or omit the return.
---
## Reason
The `?? $this` fallback in Eloquent's `__call` silently swallows scope methods that do not return the builder. A missing return causes the scope to have no effect on the query — and no error is raised, making it invisible during development.
---
## Bad Example
```php
public function scopeActive(Builder $q): void
{
    $q->where('active', true); // no return — constraint silently dropped
}
```
---
## Good Example
```php
public function scopeActive(Builder $q): Builder
{
    return $q->where('active', true);
}
```
---
## Exceptions
No common exceptions. Always return the builder explicitly.
---
## Consequences Of Violation
Scope constraints silently ignored; queries returning unfiltered results; security filters bypassed; hours of debugging time wasted on "missing" filter logic.

## Rule 2: Name Scopes with Domain Language, Not Column Names
---
## Category
Design
---
## Rule
Name scopes using business domain terminology. Never use column names or technical SQL operations in the scope name.
---
## Reason
Scope names form the vocabulary of the domain query language. `$query->active()` communicates business intent; `$query->whereActiveTrue()` leaks database implementation. Domain-named scopes are readable by non-technical stakeholders and self-documenting.
---
## Bad Example
```php
public function scopeWhereStatusActive(Builder $q): Builder
{
    return $q->where('status', 'active');
}
```
---
## Good Example
```php
public function scopeActive(Builder $q): Builder
{
    return $q->where('status', 'active');
}
```
---
## Exceptions
Scopes that are inherently technical (e.g., `scopeOrderByDate()`) with no meaningful domain equivalent. Even then, prefer domain terms like `recent()` over `orderByDate()`.
---
## Consequences Of Violation
Code that reveals database structure in every query; harder for non-technical team members to understand query code; naming inconsistency across the codebase.

## Rule 3: Keep Scopes Focused on a Single Constraint
---
## Category
Design
---
## Rule
Each scope method should apply exactly one constraint or domain concept. Compose multiple scopes at the call site. Never create scopes that combine unrelated constraints.
---
## Reason
Focused scopes are reusable, testable, and composable. A `recentActive()` scope that combines recency AND active status prevents callers from using those concepts independently — they must write duplicate inline WHERE clauses.
---
## Bad Example
```php
public function scopeRecentActive(Builder $q): Builder
{
    return $q->where('active', true)->where('created_at', '>=', now()->subDays(7));
}
```
---
## Good Example
```php
public function scopeActive(Builder $q): Builder { return $q->where('active', true); }
public function scopeRecent(Builder $q): Builder { return $q->where('created_at', '>=', now()->subDays(7)); }

// Composition at call site
User::active()->recent()->get();
```
---
## Exceptions
Domain concepts that inherently require multiple constraints and are never meaningful independently (e.g., `scopePublished()` requires status check AND date check).
---
## Consequences Of Violation
Reduced scope reusability; duplicate constraint logic across callers; difficulty testing the combined scope in isolation.

## Rule 4: Never Terminate the Query Inside a Scope
---
## Category
Architecture
---
## Rule
Never call `get()`, `first()`, `count()`, `paginate()`, or any terminal method inside a scope method. Scopes must only constrain the query, not execute it.
---
## Reason
A scope that terminates the query breaks the fluent chain for the caller — any methods added after the scope won't be applied. It also makes the scope non-composable with other scopes and impossible to inspect with `toSql()`.
---
## Bad Example
```php
public function scopeActiveAndCount(Builder $q): int
{
    return $q->where('active', true)->count(); // terminates — breaks chaining
}
```
---
## Good Example
```php
public function scopeActive(Builder $q): Builder
{
    return $q->where('active', true);
}

// Terminal method at the call site
$count = User::active()->count();
```
---
## Exceptions
No common exceptions. Scopes constrain; callers terminate.
---
## Consequences Of Violation
Broken fluent chaining; non-composable scopes; reduced testability; confusing API where some "scopes" return counts and others return builders.

## Rule 5: Limit Scopes to 15 Per Model — Extract to Custom Builder Beyond That
---
## Category
Code Organization
---
## Rule
Keep the number of local scopes on a single model under 15. When exceeding 15, extract scopes to a custom builder class or organize them into multiple query objects.
---
## Reason
A model with 20+ scopes violates single responsibility and becomes difficult to navigate, test, and maintain. The model file becomes cluttered with query logic that distracts from its primary role: defining data structure and relationships.
---
## Bad Example
```php
// 22 scope methods on one model
class User extends Model {
    public function scopeActive() { ... }
    public function scopeVerified() { ... }
    public function scopeRecent() { ... }
    // ... 20 more scopes
}
```
---
## Good Example
```php
class User extends Model {
    use HasBuilder;
    protected static string $builder = UserBuilder::class;
}

class UserBuilder extends Builder {
    public function active(): static { ... }
    public function verified(): static { ... }
    // ... organized in a dedicated class
}
```
---
## Exceptions
Models that are the central aggregate in a domain with rich query requirements. Even then, use custom builders to keep the model lean.
---
## Consequences Of Violation
Bloated model files; difficulty finding relevant scopes; reduced readability; violation of single responsibility principle.

## Rule 6: Use `@method` Annotations for IDE Autocompletion on Scopes
---
## Category
Maintainability
---
## Rule
Add `@method` PHPDoc annotations on the model class for each scope, or use `@mixin` pointing to the custom builder class, to enable IDE autocompletion.
---
## Reason
PHP's `__callStatic` magic method used by Eloquent scopes is invisible to IDEs. Without annotations, developers must memorize scope names or search the codebase, reducing scope adoption and productivity.
---
## Bad Example
```php
// No annotations — IDE shows no scope methods
class User extends Model {
    public function scopeActive(Builder $q): Builder { ... }
    public function scopeVerified(Builder $q): Builder { ... }
}
```
---
## Good Example
```php
/**
 * @method static Builder|User active()
 * @method static Builder|User verified()
 */
class User extends Model {
    public function scopeActive(Builder $q): Builder { ... }
    public function scopeVerified(Builder $q): Builder { ... }
}
```
---
## Exceptions
When using a custom builder with `@mixin` annotation (preferred for models with custom builders). Both approaches are valid — `@method` for models, `@mixin` for custom builders.
---
## Consequences Of Violation
Reduced developer adoption of scopes; team members writing inline WHERE clauses instead of using available scopes; wasted time searching for scope method names.

## Rule 7: Test Each Scope Independently and in Combinations
---
## Category
Testing
---
## Rule
Write a test for each scope in isolation, and a test exercising common scope combinations. Assert the generated SQL contains the expected WHERE clauses.
---
## Reason
Scopes are the primary query abstraction. Testing them ensures they produce correct SQL in isolation and reveals interactions when combined (e.g., two scopes that both add `where('active', true)`).
---
## Bad Example
```php
public function test_active(): void
{
    // Only tests record count — does not verify SQL structure
    $this->assertCount(3, User::active()->get());
}
```
---
## Good Example
```php
public function test_active_scope(): void
{
    $sql = User::active()->toSql();
    $this->assertStringContainsString('"active" = ?', $sql);
}

public function test_active_and_verified_combined(): void
{
    $sql = User::active()->verified()->toSql();
    $this->assertStringContainsString('"active" = ?', $sql);
    $this->assertStringContainsString('"email_verified_at" is not null', $sql);
}
```
---
## Exceptions
Integration tests with factories that test both SQL structure (via `toSql()`) and actual results. Always include SQL assertions for critical scopes.
---
## Consequences Of Violation
Scope logic errors deployed to production; combinations producing unintended SQL (duplicate constraints, conflicting WHERE clauses); inability to refactor scopes with confidence.
