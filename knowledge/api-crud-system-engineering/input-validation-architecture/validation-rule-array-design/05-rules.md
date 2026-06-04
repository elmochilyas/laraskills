# Validation Rule Array Design — Rules

## Always Declare array Rule on Parent
---
## Category
Framework Usage | Reliability
---
## Rule
Always add the `array` validation rule on the parent key of any wildcard-based array validation — without it, `*` wildcard rules are silently ignored.
---
## Reason
Laravel's wildcard expansion requires the parent field to be validated as `array`. Without the explicit `array` rule, the validator does not traverse into children and wildcard rules are never evaluated.
---
## Bad Example
```php
'tags' => ['required'], // Missing 'array' — wildcard rules ignored
'tags.*' => ['string', 'distinct'],
```
---
## Good Example
```php
'tags' => ['required', 'array', 'min:1', 'max:10'],
'tags.*' => ['string', 'distinct'],
```
---
## Exceptions
No common exceptions — always include `array` on any field that will have `*` wildcard rules.
---
## Consequences Of Violation
Wildcard rules silently do nothing; array elements pass without any validation; invalid data enters the system undetected.

---

## Always Add min and max on Array Fields
---
## Category
Security | Performance
---
## Rule
Always include both `min` and `max` constraints on every array field to enforce non-emptiness and prevent resource exhaustion.
---
## Reason
An empty array passes `array` validation but may cause business logic errors. Without `max`, an unbounded array is a DoS vector.
---
## Bad Example
```php
'tags' => ['array'], // No min (accepts empty) and no max (unbounded)
```
---
## Good Example
```php
'tags' => ['array', 'min:1', 'max:10'], // Non-empty and bounded
```
---
## Exceptions
Optional array fields that may legitimately be empty (e.g., clearing all tags) — omit `min`, but always keep `max`.
---
## Consequences Of Violation
Empty array causes iteration errors; massive array causes OOM; DoS via payload with 100,000 items.

---

## Use Distinct for Scalar Arrays, after() for Object Arrays
---
## Category
Framework Usage | Reliability
---
## Rule
Use `distinct` for scalar value uniqueness; use `after()` hook for object/array element uniqueness checks.
---
## Reason
`distinct` only works on scalar values within a flat array — it silently ignores arrays of objects. Object uniqueness requires custom comparison in the `after()` hook.
---
## Bad Example
```php
// distinct silently ignored — array of objects
'posts.*.title' => ['required', 'distinct'],
```
---
## Good Example
```php
// Scalar array — distinct works
'emails.*' => ['required', 'email', 'distinct'],

// Object array — use after() hook
$validator->after(function ($validator) {
    $titles = collect($this->input('posts'))->pluck('title');
    foreach ($titles->duplicates() as $i => $title) {
        $validator->errors()->add("posts.{$i}.title", "Duplicate title.");
    }
});
```
---
## Exceptions
No common exceptions — choose the right strategy based on data type.
---
## Consequences Of Violation
Duplicates silently pass on object arrays; developers believe distinct is working when it is not.

---

## Limit Wildcard Depth to 2-3 Levels Maximum
---
## Category
Maintainability | Performance
---
## Rule
Limit wildcard nesting to 3 levels maximum (`items.*.variants.*.sku`). Deeper nesting creates unreadable rules and exponentially expands rule count.
---
## Reason
Each wildcard level multiplies the concrete rules generated. 4 levels with 10 items produces 10,000 rule instances, slowing validation significantly.
---
## Bad Example
```php
// 4+ levels — unreadable and slow
'org.*.dept.*.team.*.member.*.name' => ['required'],
```
---
## Good Example
```php
// Max 3 levels
'org.*.dept.*.name' => ['required', 'string'],
```
---
## Exceptions
No common exceptions — restructure deep payloads or validate in the service layer with manual loops.
---
## Consequences Of Violation
Validation timeout on moderately sized payloads; unreadable rule definitions; difficulty debugging.

---

## Use Exact Wildcard Paths in required_if
---
## Category
Framework Usage | Reliability
---
## Rule
When using `required_if` inside array wildcards, include the full wildcard parent path — not just the child field name.
---
## Reason
`required_if:type,product` without the wildcard prefix compares against a non-existent root-level field, so the condition never evaluates to true.
---
## Bad Example
```php
// Wrong — 'type' at root, not under items.*
'items.*.product_id' => ['required_if:type,product'],
```
---
## Good Example
```php
// Correct — full wildcard path
'items.*.type' => ['required', Rule::in(['product', 'service'])],
'items.*.product_id' => ['required_if:items.*.type,product'],
```
---
## Exceptions
No common exceptions — the wildcard path must match the exact input structure.
---
## Consequences Of Violation
Conditional rules never apply; required fields silently optional; data integrity issues.

---

## Override Wildcard Error Messages for Clarity
---
## Category
Maintainability
---
## Rule
Customize error messages for wildcard fields to provide human-readable context instead of the default dot-notation path.
---
## Reason
Default messages include the full path (`tags.3.name`), which is cryptic for API consumers. Overridden messages provide clear, actionable feedback.
---
## Bad Example
```php
// "The tags.3.name field has a duplicate."
// Client doesn't know what this means
```
---
## Good Example
```php
public function messages(): array
{
    return [
        'tags.*.distinct' => 'Duplicate tags are not allowed.',
        'items.*.product_id.required_if' => 'Product ID required for product items.',
    ];
}
```
---
## Exceptions
No common exceptions — always override wildcard messages for user-facing APIs.
---
## Consequences Of Violation
Confusing error messages with internal paths; poor developer experience; support burden.

---

## Validate Element Type After Wildcard
---
## Category
Security | Framework Usage
---
## Rule
After a wildcard `*`, always specify the expected element type (`string`, `integer`, `array`) to prevent type-coercion attacks.
---
## Reason
Without element type validation, an attacker can submit objects where strings are expected, triggering unexpected behavior in downstream code.
---
## Bad Example
```php
'emails.*' => ['required', 'distinct'], // No type — can accept arrays or objects
```
---
## Good Example
```php
'emails.*' => ['required', 'string', 'email', 'distinct'], // Type enforced
'items.*' => ['required', 'array'],
'items.*.quantity' => ['required', 'integer', 'min:1'],
```
---
## Exceptions
When the wildcard can legitimately accept multiple types — validate with a custom rule that checks for either type.
---
## Consequences Of Violation
Array injection where scalar expected; type errors in downstream processing; security vulnerabilities from malformed input.
