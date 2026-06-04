# Fluent Through Relationships Rules

## Rule: Fluent-Laravel-Version-Check
---
## Category
Reliability
---
## Rule
Only use the fluent through relationship API in Laravel 10+ projects.
---
## Reason
The fluent API (`through()->has()`) relies on the `ThroughRelation` class introduced in Laravel 10. Using it in Laravel 9 or below causes a class-not-found error.
---
## Bad Example
```php
// In Laravel 9 project
return $this->through(Profile::class)->has(Avatar::class);
// Class not found
```
---
## Good Example
```php
// Verify composer.json requires "^10.0"
return $this->through(Profile::class)->has(Avatar::class);
```
---
## Exceptions
When a custom package backports the feature.
---
## Consequences Of Violation
Fatal runtime error, broken deployment.

## Rule: Fluent-Not-For-Simple-Chains
---
## Category
Code Organization
---
## Rule
Use traditional `hasOneThrough()`/`hasManyThrough()` syntax for simple two-table through chains.
---
## Reason
The fluent API adds verbosity without benefit for simple chains. Traditional syntax with positional arguments is more concise and widely recognized.
---
## Bad Example
```php
// Simple one-hop chain — overly verbose
return $this->through(Profile::class)->has(Avatar::class);
```
---
## Good Example
```php
// Traditional syntax is clearer for simple chains
return $this->hasOneThrough(Avatar::class, Profile::class);
```
---
## Exceptions
When consistent use of fluent API across all through relationships is a team convention.
---
## Consequences Of Violation
Unnecessary verbosity, reduced readability for simple relationships.

## Rule: Fluent-Keys-Per-Hop
---
## Category
Framework Usage
---
## Rule
Scope custom keys to each `through()` or `has()` call — keys are not positional in the fluent API.
---
## Reason
Unlike traditional syntax where all keys are positional arguments, the fluent API requires keys to be specified per hop in the corresponding `through()` or `has()` call.
---
## Bad Example
```php
return $this
    ->through(Department::class)
    ->through(Employee::class)
    ->hasMany(Report::class);
    // No custom keys — may use wrong defaults
```
---
## Good Example
```php
return $this
    ->through(Department::class, 'organization_id', 'id')
    ->through(Employee::class, 'department_id', 'id')
    ->hasMany(Report::class, 'employee_id', 'id');
```
---
## Exceptions
When all keys follow Laravel conventions exactly.
---
## Consequences Of Violation
Wrong foreign keys used, incorrect join SQL, query failures.

## Rule: Fluent-Cardinality-Correct
---
## Category
Framework Usage
---
## Rule
Use `has()` for one-to-one results and `hasMany()` for one-to-many results in the fluent API.
---
## Reason
The final method determines cardinality: `has()` returns a single model; `hasMany()` returns a collection. Using the wrong method breaks the consumer's type expectations.
---
## Bad Example
```php
// Expecting a collection, but has() returns single model
public function posts(): ThroughRelation
{
    return $this->through(User::class)->has(Post::class);
    // Returns single Post, not collection
}
```
---
## Good Example
```php
public function posts(): ThroughRelation
{
    return $this->through(User::class)->hasMany(Post::class);
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Type errors, broken iteration, unexpected null vs collection behavior.

## Rule: Fluent-Limit-Chain-Depth
---
## Category
Maintainability
---
## Rule
Limit fluent through relationship chains to a maximum of 3 hops.
---
## Reason
Each hop adds a JOIN to the SQL query. Chains beyond 3 hops produce complex, unoptimizable SQL that is difficult to debug and maintain.
---
## Bad Example
```php
return $this
    ->through(A::class)->through(B::class)
    ->through(C::class)->through(D::class)
    ->hasMany(E::class);
    // 4 hops — complex SQL, poor performance
```
---
## Good Example
```php
return $this
    ->through(B::class)->through(C::class)->hasMany(D::class);
    // 2 hops — manageable SQL
```
---
## Exceptions
When the chain maps directly to a domain concept and performance is not critical.
---
## Consequences Of Violation
Slow multi-join queries, difficulty optimizing with EXPLAIN, maintenance complexity.

## Rule: Fluent-Test-Chain-SQL
---
## Category
Testing
---
## Rule
Test fluent through relationship chains by comparing generated SQL to expected output during development.
---
## Reason
The fluent API does not validate intermediate relationships at definition time. Errors only surface at query time. Testing SQL generation catches mistakes early.
---
## Bad Example
```php
// Deployed without verifying SQL — relationship silently wrong
```
---
## Good Example
```php
// Test
public function test_avatar_relationship_sql(): void
{
    $user = User::factory()->make();
    $sql = $user->avatar()->toSql();
    $this->assertStringContainsString('inner join', $sql);
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Silent incorrect queries, wrong data, difficult debugging.

## Rule: Fluent-DocBlock-Documentation
---
## Category
Maintainability
---
## Rule
Document multi-hop fluent chains with clear DocBlocks describing each hop.
---
## Reason
Multi-hop chains are hard to read and understand without documentation. DocBlocks provide the navigation map for developers maintaining the code.
---
## Bad Example
```php
public function reports(): ThroughRelation
{
    return $this->through(Dept::class)->through(Emp::class)->hasMany(Report::class);
}
```
---
## Good Example
```php
/**
 * Organization → Department (org_id) → Employee (dept_id) → Report (emp_id)
 */
public function reports(): ThroughRelation
{
    return $this->through(Dept::class)->through(Emp::class)->hasMany(Report::class);
}
```
---
## Exceptions
Simple single-hop chains that are self-explanatory.
---
## Consequences Of Violation
Confusion about chain structure, difficulty maintaining and debugging.
