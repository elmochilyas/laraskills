# Phase 5: Rules — Domain-Specific Query Methods

## Rule 1: Name DSQMs Using Business Domain Vocabulary, Not Database Column Names
---
## Category
Design
---
## Rule
Name domain-specific query methods using the vocabulary of the business domain. Never name them after database column names or technical SQL operations.
---
## Reason
DSQMs exist to make code readable by domain experts (product managers, stakeholders). Technical names like `whereStatusPublished` reveal database implementation, not business intent. `published()` communicates "these records are published" — the ubiquity of the domain.
---
## Bad Example
```php
public function whereStatusPublished(): static
{
    return $this->where('status', 'published')->whereNotNull('published_at');
}
```
---
## Good Example
```php
public function published(): static
{
    return $this->where('status', 'published')->whereNotNull('published_at');
}
```
---
## Exceptions
No common exceptions. If a domain term does not exist for a filter, collaborate with domain experts to find one rather than falling back to technical names.
---
## Consequences Of Violation
Code that database experts but not domain experts can read; missing the purpose of DSQMs; inconsistency between domain language and codebase terminology.

## Rule 2: Always Provide Negation Methods for State-Based DSQMs
---
## Category
Design
---
## Rule
For every state-based DSQM (e.g., `published()`), provide a corresponding negation method (`unpublished()`, `notPublished()`). Never force callers to use `!` or `whereNot` to invert a DSQM.
---
## Reason
Callers should express both positive and negative domain concepts in the same fluent language. Forcing inversion at the call site breaks the abstraction and couples callers to the internal implementation of the positive method.
---
## Bad Example
```php
// No negation method — callers must invert manually
$posts = Post::query()
    ->where(function ($q) { $q->where('status', '!=', 'published')->orWhereNull('published_at'); })
    ->get();
```
---
## Good Example
```php
public function unpublished(): static
{
    return $this->where(function ($q) {
        $q->where('status', '!=', 'published')->orWhereNull('published_at');
    });
}

// Caller
$posts = Post::unpublished()->get();
```
---
## Exceptions
Temporal DSQMs that have no meaningful inverse (e.g., `trending()` → no `notTrending()`). Scalar DSQMs like `byAuthor($user)` where the inverse is `where('author_id', '!=', $user->id)` — use `byAuthorNot($user)` only if the domain requires it.
---
## Consequences Of Violation
Callers bypassing DSQMs to write inline negation; implementation logic duplicated across callers; harder-to-maintain code when the definition of "published" changes.

## Rule 3: Keep DSQMs Focused on a Single Domain Concept; Compose at the Call Site
---
## Category
Design
---
## Rule
Design each DSQM to express exactly one domain concept. Compose multiple DSQMs at the call site to build complex queries. Never create monolithic DSQMs that mix multiple unrelated domain concepts.
---
## Reason
Focused methods are testable, reusable, and composable. A `popular()` method that also adds `published()` and `featured()` constraints prevents callers from using those concepts independently.
---
## Bad Example
```php
// Monolithic — cannot use featured() without popular()
public function popular(): static
{
    return $this->published()->featured()->where('views', '>', 1000);
}
```
---
## Good Example
```php
public function popular(): static
{
    return $this->where('views', '>', 1000);
}

// Composition at call site
Post::published()->featured()->popular()->get();
```
---
## Exceptions
When a domain concept inherently requires multiple constraints that are never meaningful independently (e.g., `eligibleForPromotion()` that combines multiple eligibility rules).
---
## Consequences Of Violation
Reduced composability; duplication when callers need to reuse parts of a monolithic DSQM; increased testing surface; violation of single responsibility.

## Rule 4: Add `@method` Annotations on the Model Class for IDE Discoverability
---
## Category
Maintainability
---
## Rule
Add a `@method` PHPDoc annotation on the model class for each DSQM defined in the custom builder. Group them under a `@mixin` annotation pointing to the builder class for maintainability.
---
## Reason
IDEs cannot autocomplete DSQMs from the custom builder when accessed via the model's static proxy (`Post::published()`). Without annotations, developers resort to searching the codebase for available methods, reducing adoption.
---
## Bad Example
```php
// No annotations — IDE shows no DSQMs on Post::
class Post extends Model {
    use HasBuilder;
    protected static string $builder = PostBuilder::class;
}
```
---
## Good Example
```php
/** @mixin \App\Models\Builders\PostBuilder */
class Post extends Model {
    use HasBuilder;
    protected static string $builder = PostBuilder::class;
}
```
---
## Exceptions
Use `@method` annotations when only specific DSQMs should be exposed on the model (e.g., internal builder methods that should not be part of the public query API).
---
## Consequences Of Violation
Low developer adoption of DSQMs; team members writing inline queries instead of using available DSQMs; underutilized domain vocabulary in queries.

## Rule 5: Maintain Naming Consistency Across Models for the Same Domain Concept
---
## Category
Maintainability
---
## Rule
Use the same DSQM name across all models when the domain concept is semantically identical. If `User::subscribed()` means "has an active subscription", `Team::subscribed()` must mean the same thing.
---
## Reason
Inconsistent naming defeats the purpose of a domain-specific language. Developers must check each model to understand what a DSQM means, eroding the cognitive benefit of DSQMs.
---
## Bad Example
```php
class User extends Model {
    public function subscribed(): static { ... }
}
class Team extends Model {
    public function hasActivePlan(): static { ... } // different name, same concept
}
```
---
## Good Example
```php
class User extends Model {
    public function subscribed(): static { ... }
}
class Team extends Model {
    public function subscribed(): static { ... } // consistent naming
}
```
---
## Exceptions
When the domain concept has genuinely different semantics across models. In that case, use distinct names that reflect the difference (e.g., `User::hasActiveSubscription()` vs `Team::hasActivePlan()`).
---
## Consequences Of Violation
Developer confusion; DSQMs underutilized because they're hard to discover; increased cognitive load when switching between models.

## Rule 6: DSQMs Must Not Suppress Global Scopes Without Explicit Method Names
---
## Category
Security
---
## Rule
Name any DSQM that suppresses a global scope to make the suppression obvious. Never hide `withoutGlobalScope()` inside a DSQM with a name that does not indicate scope suppression.
---
## Reason
Global scope suppression has security implications (data leakage, soft-delete visibility). A DSQM like `allRecords()` that silently suppresses a tenant scope is a data breach waiting to happen.
---
## Bad Example
```php
// Suppresses TenantScope silently — name does not indicate scope suppression
public function allRecords(): static
{
    return $this->withoutGlobalScope(TenantScope::class);
}
```
---
## Good Example
```php
// Name clearly indicates scope suppression
public function includeAllTenants(): static
{
    return $this->withoutGlobalScope(TenantScope::class);
}
```
---
## Exceptions
DSQMs that suppress scopes and are gated behind explicit permission checks AND have clear documentation that every developer on the team is aware of.
---
## Consequences Of Violation
Data breach via hidden scope suppression; audit trail gaps; compliance violations from inadvertent multi-tenant data exposure.

## Rule 7: Test DSQMs at the SQL Level to Verify Generated Queries
---
## Category
Testing
---
## Rule
Write tests for each DSQM that assert the generated SQL is correct, not just the number of records returned. Use `toSql()` in tests to verify WHERE clauses, JOINs, and parameter bindings.
---
## Reason
DSQMs encapsulate potentially complex multi-constraint logic. Testing only record counts misses logic errors like missing conditions, wrong operators, or incorrect JOIN types. SQL-level tests document the exact query contract.
---
## Bad Example
```php
// Only tests count — does not verify the query structure
public function test_published_scope(): void
{
    Post::factory()->count(3)->create(['status' => 'published']);
    $this->assertCount(3, Post::published()->get());
}
```
---
## Good Example
```php
// Tests SQL structure — documents exact query contract
public function test_published_generates_correct_sql(): void
{
    $sql = Post::published()->toSql();
    $this->assertStringContainsString('"status" = ?', $sql);
    $this->assertStringContainsString('"published_at" is not null', $sql);
    $this->assertStringContainsString('"published_at" <= ?', $sql);
}
```
---
## Exceptions
Integration tests that verify both the SQL structure (via `toSql()`) and the actual results (via record factories). Always include at least one SQL assertion per DSQM.
---
## Consequences Of Violation
DSQMs with logic errors deployed to production; changes to DSQMs that silently break callers; insufficient test coverage on the most critical query abstraction layer.
