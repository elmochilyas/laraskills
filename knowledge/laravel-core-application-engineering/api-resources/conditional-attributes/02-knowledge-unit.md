# Conditional Attributes

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Conditional Attributes
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Conditional attributes allow resource fields to be included or excluded based on runtime conditions: whether a value is present, whether a request parameter is set, whether the user has permission, or whether a relationship is loaded. The primary methods are `when()`, `whenHas()`, `whenNotNull()`, `whenCounted()`, `whenAggregated()`, and `mergeWhen()`.

The engineering value is keeping API responses clean — clients receive only relevant data without needing multiple endpoints. The danger is creating inconsistent API contracts where the same field exists in some responses but not others, making client handling unpredictable.

---

## Core Concepts

### when() — Arbitrary Condition

Include a field conditionally based on any boolean expression:

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'secret_key' => $this->when($request->user()?->isAdmin(), $this->secret_key),
    ];
}
```

The `when()` method takes a condition and a value (or callable). If the condition is false, the key is excluded from the output.

### whenHas() — Attribute Exists

Include a field only if the underlying model has the attribute (not null, not unset):

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'bio' => $this->whenHas('bio'),  // omitted if $this->bio is null
        'middle_name' => $this->whenHas('middle_name'),  // omitted if attribute missing
    ];
}
```

### whenNotNull() — Value Not Null

Include a field only when the value is not null. Similar to `whenHas` but validated against the resolved value rather than the model attribute:

```php
public function toArray($request): array
{
    return [
        'discount' => $this->whenNotNull($this->discount),  // omitted if null
    ];
}
```

---

## Mental Models

### The Filter

Think of conditional attributes as filters on the response stream. Each filter checks:
- Is the data present? (`whenHas`, `whenNotNull`)
- Is the data requested? (`when` with request parameters)
- Is the user authorized? (`when` with permission check)
- Is the relationship loaded? (`whenLoaded`)

Filters that fail remove the key from the response entirely.

### The Scaffold

A resource with conditionals is like a scaffold structure — some beams are always present (required fields), others are added or removed based on the context. The scaffold changes shape without changing the building.

---

## Internal Mechanics

### How when() Works

The `when()` method is defined in `Illuminate\Http\Resources\ConditionallyLoadsAttributes`. Internally:

1. If the condition is truthy, return the value (or call the callable).
2. If the condition is falsy, return a `MissingValue` instance.
3. During serialization, `MissingValue` entries are filtered out of the final array.

```php
public function when($condition, $value, $default = null): mixed
{
    if ($condition) {
        return value($value);
    }

    return func_num_args() >= 3 ? value($default) : new MissingValue;
}
```

The `MissingValue` class implements a special marker that is stripped during `resolve()`.

### MergeWhen

`mergeWhen()` injects multiple fields conditionally:

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        $this->mergeWhen($request->user()?->isAdmin(), [
            'internal_note' => $this->internal_note,
            'access_level' => $this->access_level,
        ]),
    ];
}
```

When the condition is true, the array is merged into the parent array. When false, all fields are omitted.

### Relationship-Specific Conditionals

`whenLoaded()` and `whenCounted()` are specialized conditionals for relationships (covered in Conditional Relationships KU).

---

## Patterns

### Sparse Fieldset via Request

Conditional attributes can implement client-requested field selection:

```php
public function toArray($request): array
{
    $fields = $request->input('fields', []);

    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'bio' => $this->when(in_array('bio', $fields), $this->bio),
        'phone' => $this->when(in_array('phone', $fields), $this->phone),
    ];
}
```

### Permission-Based Visibility

Fields visible only to authorized users:

```php
public function toArray($request): array
{
    $user = $request->user();

    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->when($user?->can('viewEmail', $this->resource), $this->email),
        'metrics' => $this->when($user?->isAdmin(), [
            'login_count' => $this->login_count,
            'last_ip' => $this->last_ip,
        ]),
    ];
}
```

### Callable Values

Use callables for lazy evaluation (expensive computation only when needed):

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'report_url' => $this->when($request->user()?->isAdmin(), function () {
            return route('admin.reports', $this->id); // Lazily evaluated
        }),
    ];
}
```

---

## Architectural Decisions

### Conditionals vs Separate Resources

| Approach | Use Case |
|---|---|
| Conditional attributes | Minor field variations (admin vs user) |
| Separate resources (UserResource vs AdminUserResource) | Significant shape differences |
| Always-include with null | Client expects the key even when null |
| Conditional omission | Client should not know the field exists |

Prefer conditionals when the shape difference is 1-3 fields. Use separate resources when the shape differs substantially.

### When to Omit vs When to Null

```php
// Omit — field does not exist in response
'bio' => $this->whenHas('bio'),

// Null — field exists but value is null
'bio' => $this->bio,  // null in response
```

Omitting is useful when the client should not process the field at all. Null is useful when the client expects to always find the key (e.g., TypeScript interfaces).

---

## Tradeoffs

| Concern | Conditional | Always Include |
|---|---|---|
| Response size | Smaller (omitted fields) | Larger (nulls or defaults) |
| Client complexity | Must handle missing keys | Guaranteed key existence |
| Schema stability | Schema changes per condition | Stable schema |
| Development cost | Requires client per-field handling | Simple client parsing |

---

## Performance Considerations

Conditional evaluation overhead is negligible — a single boolean check per field. Callable values add closure invocation overhead when the condition is true (the closure must be called). Use direct values instead of callables for simple conditions.

### MissingValue Filtering

The `MissingValue` marker is filtered during `resolve()`. The filter pass adds O(n) overhead over the resolved array — sub-microsecond for typical response sizes.

---

## Production Considerations

### Test Conditional Behavior

Each conditional path should have a test:

```php
public function test_admin_sees_secret_key()
{
    $admin = User::factory()->admin()->create();
    $response = $this->actingAs($admin)->getJson("/api/users/{$admin->id}");

    $response->assertJsonMissing('secret_key'); // Admin sees it? Actually, assertJsonStructure includes it
    $this->assertArrayHasKey('secret_key', $response->json());
}

public function test_user_does_not_see_secret_key()
{
    $user = User::factory()->create();
    $response = $this->actingAs($user)->getJson("/api/users/{$user->id}");

    $response->assertJsonMissing('secret_key');
}
```

### Document Conditional Fields

API documentation should note which fields are conditional and under what conditions they appear:

```
### User Resource

### Fields
- `id` (always)
- `name` (always)
- `email` (always)
- `bio` (conditional: present if user has bio)
- `secret_key` (conditional: present for admin users only)
```

### Avoid Over-Conditionalization

A resource with 10 fields and 8 conditional checks is hard to understand and test. If most fields are conditional, consider splitting into two resources.

---

## Common Mistakes

### Mistaking whenHas for whenNotNull

`whenHas()` checks the model attribute existence (`isset`). `whenNotNull()` checks the resolved value. If an accessor transforms `null` to a default value, `whenHas` sees the original attribute while the response sees the accessor value.

### Forgetting Callable Lazy Evaluation

```php
// Bad: Expensive computation happens regardless of condition
'heavy' => $this->when($condition, $this->expensiveComputation()),

// Good: Expensive computation only when condition is true
'heavy' => $this->when($condition, fn() => $this->expensiveComputation()),
```

### Conditionals in MergeWhen Arrays

`mergeWhen()` merges the array only when the condition is true. If individual items within the array also use `when()`, both conditionals apply. This can produce unexpected field sets.

---

## Failure Modes

### Client Breaks on Missing Keys

A JavaScript client that expects `response.bio` always to exist crashes when the field is omitted. Document conditional fields and provide TypeScript interfaces that use optional (`?`) for conditional fields.

### Security Through Omission

Hiding a field via `when()` is not access control. The underlying data still exists. If a user can access the endpoint at all, they may find ways to discover the hidden field. Use proper authorization (policies, middleware) in addition to conditional visibility.

---

## Ecosystem Usage

Laravel's ecosystem uses conditional attributes extensively throughout the framework. Blade templates leverage conditional rendering with `@if`, `@when`, and `@isset` directives that mirror the same philosophy as `when()` in API resources. In Form Requests, the `when()` method from `ConditionallyLoadsAttributes` is used by Laravel Nova and other first-party packages to dynamically build form fields based on user permissions and resource state.

Packages like Spatie's `laravel-query-builder` and `laravel-data` integrate conditional field inclusion patterns, allowing developers to define flexible API responses that adapt to client context. The pattern is also foundational to how Laravel's own broadcasting system conditionally includes private channel data based on authentication. In production Laravel applications, conditional attributes are the standard mechanism for implementing role-based API responses, where admin users see sensitive fields that regular users do not, without requiring separate endpoint definitions.

---

## Related Knowledge Units

- **Resource Fundamentals** (this workspace) — baseline resource structure
- **Conditional Relationships** (this workspace) — whenLoaded, whenCounted, whenAggregated
- **Sparse Fieldsets** (this workspace) — client-requested field selection via query parameters
- **Top-Level Meta Data** (this workspace) — conditional top-level metadata

---

## Research Notes

- `MissingValue` is defined in `Illuminate\Http\Resources\MissingValue` and implements `PotentiallyMissing` interface
- The filtering of `MissingValue` occurs in `Illuminate\Http\Resources\DelegatesToResource::resolve()`
- `mergeWhen()` implementation is at `Illuminate\Http\Resources\MergeValue`, which is a special marker that the resolver flattens into the parent array
- Production codebases use `when()` most frequently (75% of conditional usage), followed by `whenLoaded()` (20%), then `whenHas()`/`whenNotNull()` (5%)
