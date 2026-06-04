# Conditional Attributes — Rules

## Rule 1: Always Wrap Resource Relationship Fields in `whenLoaded()`
---
## Category
Performance
---
## Rule
Every nested resource field that accesses a relationship must use `$this->whenLoaded('relation')` instead of directly accessing the relation.
---
## Reason
Direct access triggers lazy loading (N+1) when the relationship was not eager-loaded, causing a query per model in a collection.
---
## Bad Example
```php
return [
    'posts' => PostResource::collection($this->posts),
];
```
---
## Good Example
```php
return [
    'posts' => PostResource::collection($this->whenLoaded('posts')),
];
```
---
## Exceptions
Relationships that are guaranteed to be loaded by framework convention (e.g., the parent model in a child resource where the relationship is always loaded).
---
## Consequences Of Violation
N+1 query explosion on listing endpoints; silent performance degradation that scales with page size.

---

## Rule 2: Use `whenNotNull()` Instead of Manual Null Checks for Optional Fields
---
## Category
Code Organization
---
## Rule
Prefer `$this->whenNotNull($this->field)` over `$this->when($this->field !== null, $this->field)` or ternary operators for nullable optional fields.
---
## Reason
`whenNotNull()` is more explicit about intent, handles empty strings correctly, and reduces visual noise in resource arrays.
---
## Bad Example
```php
'summary' => $this->when($this->summary !== null, $this->summary),
```
---
## Good Example
```php
'summary' => $this->whenNotNull($this->summary),
```
---
## Exceptions
When the condition requires logic beyond null checks (e.g., include when field has a specific non-null value).
---
## Consequences Of Violation
Verbose, less readable resource code; increased likelihood of off-by-one logic errors with empty/falsy values.

---

## Rule 3: Use `whenCounted()` for Aggregate Fields Loaded via `withCount`
---
## Category
Framework Usage
---
## Rule
Use `$this->whenCounted('relation')` for fields that display aggregate values (count, sum, avg) loaded via `withCount` or `withAggregate`, not `whenLoaded()`.
---
## Reason
`whenLoaded()` checks `relationLoaded()` which is false for aggregates; `whenCounted()` checks the specific aggregate attribute, correctly including it when available.
---
## Bad Example
```php
'comments_count' => $this->whenLoaded('comments')
    ? $this->comments_count
    : null,
```
---
## Good Example
```php
'comments_count' => $this->whenCounted('comments'),
```
---
## Exceptions
No common exceptions. Each aggregate method (`whenCounted`, `whenAggregated`, `whenHas`) has a specific purpose and is not interchangeable.
---
## Consequences Of Violation
Aggregate values silently absent from responses despite being loaded; incorrect serialization logic that confuses API consumers.

---

## Rule 4: Extract Complex Conditional Chains into Private Methods
---
## Category
Maintainability
---
## Rule
When `toArray()` contains nested or deeply chained conditional logic, extract the conditional blocks into private methods on the resource class.
---
## Reason
Deeply nested `when()` inside `mergeWhen()` inside another `when()` is unreadable and untestable without mocking the entire resource.
---
## Bad Example
```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        $this->mergeWhen($request->user()?->isAdmin(), [
            'notes' => $this->whenNotNull($this->internal_notes),
            'flag' => $this->when($this->flag !== null, fn () => [
                'reason' => $this->flag->reason,
                'raised_by' => $this->whenLoaded('flag.author'),
            ]),
        ]),
    ];
}
```
---
## Good Example
```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        $this->mergeWhen($request->user()?->isAdmin(), $this->adminFields()),
    ];
}

private function adminFields(): array
{
    return [
        'notes' => $this->whenNotNull($this->internal_notes),
        'flag' => $this->flagDetails(),
    ];
}

private function flagDetails(): array|Missing
{
    return $this->when($this->flag !== null, fn () => [
        'reason' => $this->flag->reason,
        'raised_by' => $this->whenLoaded('flag.author'),
    ]);
}
```
---
## Exceptions
Simple two-condition chains that fit on a single line and are easily readable.
---
## Consequences Of Violation
Reduced code readability; difficulty in unit testing conditional logic; increased merge conflicts in resource files.

---

## Rule 5: Always Pass Closures as `$value` for Expensive Computed Fields
---
## Category
Performance
---
## Rule
Pass a Closure as the second argument to `when()` when the value requires computation, database access, or object instantiation.
---
## Reason
PHP evaluates arguments before passing them; without a Closure, the expensive computation runs regardless of whether the condition is true, wasting resources.
---
## Bad Example
```php
'expensive' => $this->when($condition, $this->computeExpensiveValue()),
```
---
## Good Example
```php
'expensive' => $this->when($condition, fn () => $this->computeExpensiveValue()),
```
---
## Exceptions
Simple scalar values or pre-computed properties that are already available in memory.
---
## Consequences Of Violation
Unnecessary computation on every serialization even when the field is excluded; degraded response times.

---

## Rule 6: Test Both Branches of Every Conditional Attribute
---
## Category
Testing
---
## Rule
Write feature tests that verify conditionally-included attributes are present when the condition is met and absent when it is not.
---
## Reason
Untested conditionals can produce silent omissions or data leaks that are not caught by code review. A `when()` with a typo or wrong condition never surfaces an error — the field is simply absent.
---
## Bad Example
```php
// No test for the admin-only field
'ssn' => $this->when(auth()->user()?->isAdmin(), $this->ssn),
```
---
## Good Example
```php
public function test_admin_sees_ssn(): void
{
    $response = $this->actingAs(Admin::factory()->create())
        ->getJson('/api/users/1');
    $response->assertJsonStructure(['data' => ['ssn']]);
}

public function test_non_admin_does_not_see_ssn(): void
{
    $response = $this->actingAs(User::factory()->create())
        ->getJson('/api/users/1');
    $response->assertJsonMissingPath('data.ssn');
}
```
---
## Exceptions
No common exceptions. Both branches are always testable.
---
## Consequences Of Violation
Data leaks to unauthorized users; silent omission of required fields; regressions introduced by unrelated changes.

---

## Rule 7: Never Use `whenLoaded()` as a Workaround for Missing Eager Loading
---
## Category
Design
---
## Rule
Do not use `whenLoaded()` to silently swallow missing relationship data. Always fix the query to eager-load the relationship if the data is expected.
---
## Reason
`whenLoaded()` silently omits the field when the relation is not loaded, hiding query bugs. The field disappears from output with no error, making debugging difficult.
---
## Bad Example
```php
// Controller: User::all();  (posts not loaded)
// Resource:
'posts' => PostResource::collection($this->whenLoaded('posts')),
// posts silently absent from all responses
```
---
## Good Example
```php
// Controller: User::with('posts')->get();
// Resource:
'posts' => PostResource::collection($this->whenLoaded('posts')),
```
---
## Exceptions
Optional relationship data that legitimately may or may not be loaded depending on the endpoint context.
---
## Consequences Of Violation
Missing data in API responses; developer confusion when fields disappear without errors; hours of debugging to trace the root cause.

---

## Rule 8: Use Specific Conditional Methods Over Generic `when()`
---
## Category
Code Organization
---
## Rule
Prefer `whenLoaded()`, `whenCounted()`, `whenNotNull()`, `whenHas()`, and `whenPivotLoaded()` over the generic `when()` when the condition matches a specific check.
---
## Reason
Specific methods are self-documenting — they communicate the exact condition being checked without requiring the reader to parse a boolean expression.
---
## Bad Example
```php
'comments' => $this->when($this->relationLoaded('comments'), ...),
```
---
## Good Example
```php
'comments' => $this->whenLoaded('comments'),
```
---
## Exceptions
Custom conditions that do not match any of the specialized methods (e.g., role-based or time-based inclusion).
---
## Consequences Of Violation
Less readable resource code; inconsistent use of the conditional API; missed opportunities for idiomatic patterns.

---

## Rule 9: Never Use `when()` with Non-Boolean Conditions That Have Falsy Ambiguity
---
## Category
Reliability
---
## Rule
Always use explicit boolean expressions in `when($condition, ...)` to avoid ambiguity with PHP falsy values like `0`, `'0'`, `''`, or `null`.
---
## Reason
`when()` uses truthiness. A numeric `0`, empty string, or `null` is falsy and causes the field to be excluded even when the intent was to include it.
---
## Bad Example
```php
'discount' => $this->when($this->discount, $this->discount),
// Excludes discount when it's zero (falsy but valid)
```
---
## Good Example
```php
'discount' => $this->when($this->discount !== null, $this->discount),
```
---
## Exceptions
Boolean model attributes where `true`/`false` are the only possible values and `null` is not valid.
---
## Consequences Of Violation
Valid data values silently excluded from responses; API contract violations that only surface for certain data ranges.

---

## Rule 10: Use `mergeWhen()` for Grouping Multiple Optional Fields That Stand Together
---
## Category
Code Organization
---
## Rule
Use `mergeWhen($condition, [...])` to include a group of related optional fields that are always present or absent together, rather than repeating `when()` for each field.
---
## Reason
Grouping with `mergeWhen()` reduces duplication, makes the relationship between fields explicit, and improves readability when multiple fields depend on the same condition.
---
## Bad Example
```php
'editor_notes' => $this->when($isAdmin, $this->notes),
'ip_address' => $this->when($isAdmin, $this->ip),
'internal_id' => $this->when($isAdmin, $this->internal_id),
```
---
## Good Example
```php
$this->mergeWhen($isAdmin, [
    'editor_notes' => $this->notes,
    'ip_address' => $this->ip,
    'internal_id' => $this->internal_id,
]),
```
---
## Exceptions
When individual fields within the group need different conditions (e.g., some admin fields should only appear with additional authorization).
---
## Consequences Of Violation
Repetitive, verbose resource arrays; higher risk of copy-paste errors when conditions are duplicated across multiple fields.
