# Anti-Patterns — Validation Rule Array Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Knowledge Unit | Validation Rule Array Design |
| Difficulty | Intermediate |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Deep Nesting Beyond 3 Wildcards | Medium | Low | Code review: `a.*.b.*.c.*.d` wildcard chains |
| No Array Size Limits | Critical | Medium | Code review: array field without min/max constraints |
| distinct for Object Uniqueness | High | Medium | Code review: `distinct` applied to array of objects |
| Wildcard Rules Without Element Type | Medium | Medium | Code review: `items.*` without specifying element type |
| Manual foreach Validation in FormRequest | High | Medium | Code review: loop-based validation instead of wildcard rules |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Forgetting array Rule on Parent | `*` wildcard without declaring parent as `array` | Wildcard rules silently ignored |
| No min:1 on Arrays | Empty arrays pass validation | Business logic receives unexpected empty collections |
| Wildcard in required_if Mismatch | `required_if:type,product` without parent wildcard path | Condition never applies |

---

## Anti-Pattern Details

### AP-VRA-01: Deep Nesting Beyond 3 Wildcards

**Description**: Validation rules use 4+ levels of wildcard nesting to validate deeply nested JSON structures: `data.attributes.items.*.variants.*.pricing.*.tier`. Each wildcard level expands into N concrete rules, creating exponential rule counts for large arrays. The rules become unreadable, hard to debug, and slow to execute.

**Root Cause**: Accepting extremely nested input structures. The API payload design pushes validation complexity to the rule layer.

**Impact**:
- Rule expansion: 4 wildcards × 10 items × 5 variants × 3 pricing tiers = 600 concrete rules
- Validation latency proportional to total expanded rule count
- Debugging which rule failed for which element is extremely difficult
- Error messages reference paths like `data.attributes.items.3.variants.1.pricing.2.tier`

**Detection**:
- Code review: 4+ wildcard `*` levels in a single rule path
- Code review: rule arrays with 50+ entries due to deep nesting
- Performance: slow validation for deeply nested payloads

**Solution**:
- Limit input nesting to 2-3 levels maximum
- Flatten deeply nested structures at the API boundary
- Validate deeply nested data in service layer with per-item `Validator::make()`
- Consider alternative payload designs that reduce nesting

**Example**:
```php
// BEFORE: Deep nesting
'data.attributes.items.*.variants.*.pricing.*.tier' => ['required', 'string'], // ❌ 4 wildcards

// AFTER: Flattened structure
// Accept: { "items": [{ "sku": "...", "price": 10.00 }] }
// Instead of: { "data": { "attributes": { "items": [{ "variants": [{ "pricing": [{ "tier": "..." }] }] }] } } }

'items' => ['required', 'array', 'min:1', 'max:50'],
'items.*.sku' => ['required', 'string'],
'items.*.price' => ['required', 'numeric', 'min:0'],
```

---

### AP-VRA-02: No Array Size Limits

**Description**: Array fields are declared with `'array'` rule but without `min` and `max` constraints. An attacker can submit an array with 100,000 elements, triggering massive rule expansion, memory consumption, and slow validation. Even without malicious intent, missing size limits allow unbounded data ingestion that the downstream system cannot handle.

**Root Cause**: Oversight or assuming clients will send reasonable payloads. The developer focuses on element validation and forgets to bound the array itself.

**Impact**:
- DoS vulnerability: unlimited array sizes exhaust server resources
- Memory consumption from validating thousands of elements
- Slow responses due to O(n) validation on unbounded arrays
- Database batch operations fail on unexpectedly large arrays

**Detection**:
- Code review: `'tags' => ['required', 'array']` without `min:1` or `max:N`
- Code review: `'items' => ['array']` — no size constraints
- Security testing: sending 10000-element arrays and observing server behavior

**Solution**:
- Always enforce `min:1` (if non-empty required) and `max:N` on array fields
- Set `max` based on expected use case (50 for typical bulk, 500 for admin operations)
- Use per-resource or per-user max limits

**Example**:
```php
// BEFORE: No size limits
'posts' => ['required', 'array'], // ❌ unlimited
'posts.*.title' => ['required', 'string', 'max:255'],

// AFTER: With size limits
'posts' => ['required', 'array', 'min:1', 'max:50'], // ✅ bounded
'posts.*.title' => ['required', 'string', 'max:255'],
```

---

### AP-VRA-03: distinct for Object Uniqueness

**Description**: The `distinct` rule is applied to an array of objects to check for unique values across elements: `'items.*.sku' => ['distinct']`. However, `distinct` only works on scalar values — it cannot check uniqueness of an object or sub-array. When applied to an array of objects, `distinct` checks whether each entire stringified object is unique, which is not useful, or silently fails to detect duplicates.

**Root Cause**: Misunderstanding `distinct` behavior. The developer assumes `distinct` works on any array element type.

**Impact**:
- Duplicate SKUs across items pass validation undetected
- Array-of-objects uniqueness checks silently fail
- Business logic receives duplicate data that should have been rejected
- Wasteful rollback: duplicates discovered at the database level via unique constraints

**Detection**:
- Code review: `distinct` rule on a wildcard path pointing to an object or sub-array
- Code review: `'items.*' => ['distinct']` — distinct on entire items
- Integration tests: duplicate objects pass validation

**Solution**:
- Use `distinct` only for scalar-valued arrays (e.g., `emails.*` → distinct is fine)
- For object uniqueness (unique SKU across items), use the `after()` hook
- In the `after()` hook, iterate values and check for duplicates programmatically

**Example**:
```php
// BEFORE: distinct on object array
'items.*.sku' => ['required', 'string', 'distinct'], // ❌ distinct may not work as expected

// AFTER: Unique check in after() hook
protected function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        if ($validator->errors()->isNotEmpty()) {
            return;
        }
        $skus = collect($this->input('items'))->pluck('sku');
        $duplicates = $skus->duplicates();
        if ($duplicates->isNotEmpty()) {
            foreach ($duplicates as $index => $sku) {
                $validator->errors()->add(
                    "items.{$index}.sku",
                    "Duplicate SKU '{$sku}' found in batch."
                );
            }
        }
    });
}
```

---

### AP-VRA-04: Wildcard Rules Without Element Type

**Description**: Array element rules are defined without specifying the element type: `'items.*' => ['required', 'distinct']` without first declaring whether `items.*` should be a string, integer, or object. The validator doesn't know what type each array element should be, so type-based rules on child fields may silently fail.

**Root Cause**: Assuming the element type is implied by the field name or child rules. The developer skips the type rule as redundant.

**Impact**:
- Array elements may be of unexpected types (numbers when strings expected)
- Child rules like `string`, `integer`, or `email` are not enforced
- Mixed-type arrays pass validation (some strings, some numbers)
- Data integrity issues downstream when types don't match expectations

**Detection**:
- Code review: `items.*` without `string`, `integer`, or `array` type on the wildcard
- Code review: `tags.* => ['distinct']` without `'tags.*' => ['string']`
- Integration tests: mixed-type arrays passing validation

**Solution**:
- Always specify the element type on wildcard rules
- Declare type before other constraints: `'tags.*' => ['string', 'max:50', 'distinct']`
- For arrays of objects, declare `'items.*' => ['array']` before child rules

**Example**:
```php
// BEFORE: No element type
'tags' => ['required', 'array', 'min:1', 'max:10'],
'tags.*' => ['distinct'], // ❌ no type — strings, numbers, or objects all pass

// AFTER: With element type
'tags' => ['required', 'array', 'min:1', 'max:10'],
'tags.*' => ['string', 'max:50', 'distinct'], // ✅ type enforced

// For arrays of objects:
'items' => ['required', 'array', 'min:1', 'max:50'],
'items.*' => ['array'], // ✅ declare object type
'items.*.sku' => ['required', 'string'],
'items.*.quantity' => ['required', 'integer', 'min:1'],
```

---

### AP-VRA-05: Manual foreach Validation in FormRequest

**Description**: Instead of using wildcard rules (`items.*.title`), the developer writes a loop in `withValidator()` or `after()` that iterates over array elements and validates each one manually with individual `Validator::make()` calls. This re-implements what wildcard rules provide declaratively, making the validation imperative, verbose, and harder to test.

**Root Cause**: Not knowing about wildcard rules. The developer comes from a background where array validation required manual iteration.

**Impact**:
- 10+ lines of validation code where a single wildcard rule suffices
- Manual error collection and formatting required
- More surface area for bugs compared to declarative wildcards
- Test coverage must cover the manual loop logic

**Detection**:
- Code review: `foreach ($this->input('items') as $index => $item)` inside `withValidator()`
- Code review: `Validator::make()` called inside a loop within a FormRequest
- Code review: manual `$validator->errors()->add()` calls for each element

**Solution**:
- Use wildcard rules for all per-element validation
- Reserve manual validation in `after()` only for cross-item checks (uniqueness, combinations)
- Let the framework handle element-level rule expansion

**Example**:
```php
// BEFORE: Manual foreach validation
protected function withValidator(Validator $validator): void
{
    $items = $this->input('items', []);
    foreach ($items as $index => $item) {
        $itemValidator = Validator::make($item, [
            'title' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);
        if ($itemValidator->fails()) {
            foreach ($itemValidator->errors()->toArray() as $field => $messages) {
                foreach ($messages as $message) {
                    $validator->errors()->add("items.{$index}.{$field}", $message);
                }
            }
        }
    }
}

// AFTER: Wildcard rules (declarative, no manual loop)
public function rules(): array
{
    return [
        'items' => ['required', 'array', 'min:1', 'max:50'],
        'items.*.title' => ['required', 'string', 'max:255'],
        'items.*.quantity' => ['required', 'integer', 'min:1'],
    ];
}
```
