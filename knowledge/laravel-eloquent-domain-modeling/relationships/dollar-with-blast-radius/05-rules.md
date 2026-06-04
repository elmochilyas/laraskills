# $with Blast Radius Rules

## Rule: Avoid-With-On-Widely-Used-Models
---
## Category
Performance
---
## Rule
Never use `$with` on widely-used models like `User`, `Team`, or `Organization`.
---
## Reason
`$with` on a widely-used model affects every query across the entire application: controllers, commands, jobs, tests, and seeders. The blast radius multiplies query count everywhere.
---
## Bad Example
```php
class User extends Model
{
    protected $with = ['profile']; // Every User query loads profile
}
```
---
## Good Example
```php
class User extends Model
{
    protected $with = []; // Empty — explicit with() at query site
}

// Query site
User::with('profile')->get();
```
---
## Exceptions
When profiling proves the relationship is needed on 100% of queries for that model.
---
## Consequences Of Violation
Hidden performance regressions across the entire application, test suite slowdown.

## Rule: Prefer-Explicit-With
---
## Category
Code Organization
---
## Rule
Use explicit `with()` at the query site instead of `$with` on the model definition.
---
## Reason
`with()` at the query site is self-documenting, scoped to the specific use case, and can use constraint closures. `$with` is invisible, unconditional, and cannot be constrained.
---
## Bad Example
```php
// Model layer — hidden behavior
protected $with = ['comments'];

// Controller — no indication comments are loaded
$posts = Post::all();
```
---
## Good Example
```php
// Model layer — clean
protected $with = [];

// Controller — explicit and visible
$posts = Post::with('comments')->get();
```
---
## Exceptions
Highly specialized models with narrow usage scope (e.g., `MediaConversion` used only in one subsystem).
---
## Consequences Of Violation
Hidden query overhead, reduced code clarity, coupling between model and all consumers.

## Rule: WithoutEagerLoads-Batch-Operations
---
## Category
Performance
---
## Rule
Use `withoutEagerLoads()` in batch-processing jobs, seeders, factories, and Artisan commands.
---
## Reason
`$with` relationships are loaded even in contexts where they are never used (imports, exports, background jobs). Suppressing them prevents unnecessary queries.
---
## Bad Example
```php
// Seeder — $with loads relationship for every created model
User::factory(1000)->create();
```
---
## Good Example
```php
Model::withoutEagerLoads(function () {
    User::factory(1000)->create();
});
```
---
## Exceptions
When the batch operation actually uses the relationship.
---
## Consequences Of Violation
Dramatically slower seeders, batch jobs, and test suites.

## Rule: Audit-With-Regularly
---
## Category
Maintainability
---
## Rule
Audit `$with` declarations regularly and remove any that are not proven necessary by profiling.
---
## Reason
`$with` declarations accumulate over time as developers add "convenience" relationships. Each addition compounds the query overhead across the entire application.
---
## Bad Example
```php
// Over time, $with grows silently
class Post extends Model
{
    protected $with = ['user', 'category', 'tags', 'media'];
    // Each added without auditing existing ones
}
```
---
## Good Example
```php
class Post extends Model
{
    protected $with = ['user']; // Only what profiling proves is always needed
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Creeping query count regression, hard-to-diagnose performance issues.

## Rule: Add-CI-Lint-For-With
---
## Category
Code Organization
---
## Rule
Add CI lint rules that flag or warn about `$with` usage on widely-used models.
---
## Reason
Preventing `$with` on widely-used models is a policy decision. Automated lint rules catch violations during code review rather than after deployment.
---
## Bad Example
```php
// No lint rule — $with on User passes CI
class User extends Model
{
    protected $with = ['profile'];
}
```
---
## Good Example
```php
// CI rule: "Disallow $with on User, Team, Organization models"
// phpstan or phpcs rule enforces this
```
---
## Exceptions
When explicitly approved with documented profiling evidence.
---
## Consequences Of Violation
Performance regressions deployed to production unnoticed.

## Rule: WithoutEagerLoads-Tests
---
## Category
Testing
---
## Rule
Use `withoutEagerLoads()` in test suite base setup to prevent `$with` from slowing tests.
---
## Reason
`$with` on models used in factories and test assertions adds unnecessary queries to every test, dramatically slowing the test suite.
---
## Bad Example
```php
// Every test that creates a User loads profile unnecessarily
$user = User::factory()->create();
```
---
## Good Example
```php
// TestCase.php
protected function setUp(): void
{
    parent::setUp();
    Model::withoutEagerLoads(function () {
        // Test scope
    });
}
```
---
## Exceptions
When tests specifically need to verify `$with` behavior.
---
## Consequences Of Violation
Slow test suite, frustrated developers, test timeouts on large suites.

## Rule: With-Lack-Of-Constraints
---
## Category
Architecture
---
## Rule
Do not use `$with` when the relationship requires any filtering, ordering, or column selection.
---
## Reason
`$with` does not support constraint closures. If you need to limit, order, or select specific columns from the related table, you must use explicit `with()` at the query site.
---
## Bad Example
```php
protected $with = ['comments']; // No way to filter approved only
```
---
## Good Example
```php
// Query site — can constrain
Post::with(['comments' => fn($q) => $q->where('approved', true)->latest()])->get();
```
---
## Exceptions
None.
---
## Consequences Of Violation
Unfiltered/unordered relationship data loaded on every query.
