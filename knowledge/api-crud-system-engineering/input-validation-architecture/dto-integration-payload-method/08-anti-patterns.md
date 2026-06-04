# Anti-Patterns — DTO Integration: payload() Method

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Knowledge Unit | DTO Integration: payload() Method |
| Difficulty | Advanced |
| Category | Integration Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| payload Returning Array Instead of Typed DTO | High | Medium | Code review: return type is `array` instead of a typed class |
| payload Mixing Validated and Request Data | Critical | Medium | Code review: `$this->input()` alongside `$this->validated()` in payload() |
| payload With Side Effects | High | Medium | Code review: DB queries, API calls, or dispatch in payload() |
| payload With Business Logic | Medium | Low | Code review: calculations and domain rules in payload() |
| payload Called Before Validation | Critical | High | Code review: controller accesses payload() without type-hinting the FormRequest |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Multiple validated() Calls in payload | Each builds the filtered array from scratch | Redundant work; performance waste |
| Nested DTO Receiving Raw Array | Nested `from()` called on unvalidated nested data | TypeError or data leak from unvalidated nested input |
| Returning Mutable DTO From payload | DTO properties can be mutated after construction | Downstream code changes validated data unpredictably |

---

## Anti-Pattern Details

### AP-DPM-01: payload Returning Array Instead of Typed DTO

**Description**: The `payload()` method has an `array` return type instead of a typed DTO class. The controller receives a raw associative array with string keys and mixed values — the same as calling `$request->validated()`. This defeats the purpose of `payload()` entirely: no type safety, no IDE autocompletion, no compile-time contract enforcement.

**Root Cause**: Partial adoption. The developer adds a `payload()` method but returns `$this->validated()` directly without constructing a DTO.

**Impact**:
- No type safety: controller cannot tell what data shape it receives
- Magic keys: `$data['title']` instead of `$dto->title` — no autocompletion
- Refactoring risk: renaming a DTO field doesn't flag array key usages
- Null safety: array keys may be missing; DTO constructor enforces requirements

**Detection**:
- Code review: `payload()` return type is `array` or missing
- Code review: `return $this->validated()` as the entire payload() body
- Controller review: `$request->payload()['field']` instead of `$request->payload()->field`

**Solution**:
- Always return a typed DTO from `payload()`
- Use Spatie's `from()` or a constructor-based DTO
- Never return `$this->validated()` directly

**Example**:
```php
// BEFORE: Returning array
public function payload(): array // ❌ no type safety
{
    return $this->validated();
}

// AFTER: Returning typed DTO
public function payload(): PostData // ✅ typed return
{
    return PostData::from([
        ...$this->validated(),
        'author_id' => $this->user()->id,
    ]);
}
```

---

### AP-DPM-02: payload Mixing Validated and Request Data

**Description**: The `payload()` method sources data from both `$this->validated()` and `$this->input()` or `$this->all()`. While some fields come from validated data, others bypass validation entirely — leaking unvalidated, unsanitized input into the DTO. An attacker can inject malicious data through fields not covered by validation rules.

**Root Cause**: Convenience. The developer needs access to a field that isn't in the validation rules (e.g., a server-generated field) and uses `$this->input()` instead of adding it to `passedValidation()`.

**Impact**:
- Unvalidated data enters the service layer through the DTO
- Attackers can inject arbitrary fields not covered by rules
- Security audit cannot confirm all DTO data passed validation
- The validation contract is effectively bypassed

**Detection**:
- Code review: `$this->input()`, `$this->all()`, or `$this->json()` calls inside `payload()`
- Code review: fields in the DTO that don't appear in `rules()`
- Security audit: DTO properties with no corresponding validation rule

**Solution**:
- Use only `$this->validated()` as the data source for payload()
- Inject server-generated fields (user ID, IP, timestamps) via `passedValidation()` before calling `payload()`
- Never reference `$this->input()` inside `payload()`

**Example**:
```php
// BEFORE: Mixing validated and unvalidated data
public function payload(): PostData
{
    return PostData::from([
        ...$this->validated(),
        'author_id' => $this->input('author_id'), // ❌ unvalidated — could be tampered
    ]);
}

// AFTER: All data sourced from validated
protected function passedValidation(): void
{
    $this->merge([
        'author_id' => $this->user()->id, // ✅ injected before validation completes
    ]);
}

public function payload(): PostData
{
    return PostData::from($this->validated()); // ✅ only validated data
}
```

---

### AP-DPM-03: payload With Side Effects

**Description**: The `payload()` method performs I/O operations — database queries, external API calls, file uploads, or job dispatches — in addition to constructing the DTO. Since `payload()` may be called during request handling, these side effects can execute multiple times (if called multiple times) or fail unpredictably, breaking the principle that DTO construction should be a pure mapping.

**Root Cause**: Convenience. The developer needs to fetch related data for DTO construction and places the query in `payload()` because it's the only place the DTO is built.

**Impact**:
- Multiple calls to `payload()` execute side effects multiple times
- Failed API calls during DTO construction return 500 instead of a clean error response
- Cannot test `payload()` in isolation — requires mocking external services
- Side effects occur in unexpected lifecycle phases (e.g., during validation re-processing)

**Detection**:
- Code review: `DB::query()`, `Http::get()`, `Storage::put()`, or `dispatch()` in `payload()`
- Code review: try/catch blocks in `payload()` for I/O operations
- Test review: `payload()` tests require database or mock setup

**Solution**:
- Keep `payload()` as a pure mapping function — no I/O
- Fetch required data in the controller or service layer before calling `payload()`
- Pass fetched data as constructor arguments to the DTO

**Example**:
```php
// BEFORE: Side effects in payload
public function payload(): OrderData
{
    $product = Product::findOrFail($this->validated('product_id')); // ❌ DB query in DTO construction
    return OrderData::from([
        ...$this->validated(),
        'product_name' => $product->name,
        'unit_price' => $product->price,
    ]);
}

// AFTER: Pure mapping
public function payload(): OrderData
{
    return OrderData::from($this->validated()); // ✅ no I/O — product data added in service layer
}

// Service layer enriches the DTO:
class OrderService
{
    public function create(OrderData $data): Order
    {
        $product = Product::findOrFail($data->productId);
        // ...
    }
}
```

---

### AP-DPM-04: payload With Business Logic

**Description**: The `payload()` method contains business logic — pricing calculations, discount eligibility checks, stock availability verification, or status transitions — that belongs in the service layer. `payload()` should only map validated data to a DTO; any logic that makes decisions or computes domain values should be in services or actions.

**Root Cause**: Misunderstanding the purpose of `payload()` as a DTO factory rather than a business logic method.

**Impact**:
- Business logic is coupled to the HTTP request layer — cannot reuse in jobs or CLI
- Testing business logic requires FormRequest instantiation
- Business rules silently change validated data after the validation contract
- Violates separation of concerns: request layer doing service-layer work

**Detection**:
- Code review: conditionals, loops, or calculations in `payload()` beyond simple mapping
- Code review: calls to service classes or domain objects inside `payload()`
- Test review: `payload()` tests include business logic assertions

**Solution**:
- Keep `payload()` focused on data mapping only — no decision logic
- Move business logic to the service layer or action classes
- Use the DTO as a simple data container; let services make decisions

**Example**:
```php
// BEFORE: Business logic in payload
public function payload(): OrderData
{
    $quantity = $this->validated('quantity');
    $price = $this->validated('price');
    $total = $quantity * $price;

    if ($total > 100) {
        $total *= 0.9; // ❌ business logic (10% discount)
    }

    return OrderData::from([
        ...$this->validated(),
        'total' => $total,
    ]);
}

// AFTER: Pure mapping in payload
public function payload(): OrderData
{
    return OrderData::from($this->validated()); // ✅ no business logic
}

// Business logic in service layer:
class OrderService
{
    public function create(OrderData $data): Order
    {
        $total = $data->quantity * $data->price;
        if ($total > 100) {
            $total *= 0.9;
        }
        // ... create order with computed total
    }
}
```

---

### AP-DPM-05: payload Called Before Validation

**Description**: The controller calls `$request->payload()` without type-hinting the FormRequest in the method signature, or calls it before the framework has resolved and validated the request. If `payload()` depends on `validated()`, calling it before validation throws an exception or returns empty data. Even if it doesn't crash, the data is unvalidated and potentially malicious.

**Root Cause**: Incorrect dependency injection. The controller type-hints the base `Request` instead of the specific `FormRequest`, so validation never runs before `payload()` is accessed.

**Impact**:
- DTO constructed from unvalidated data — security vulnerability
- `validated()` throws `ValidationException` or returns empty array
- Business logic executes on attacker-controlled data
- Data integrity: unvalidated input flows directly to services

**Detection**:
- Code review: controller method parameter is `Request $request` instead of `StorePostRequest $request`
- Code review: manual `$request->validate()` call before `$request->payload()`
- Integration tests: payload() called without FormRequest validation

**Solution**:
- Always type-hint the specific FormRequest in the controller method signature
- Never type-hint `Request` when a FormRequest is expected
- Remove manual `validate()` calls — let Laravel's DI resolve validation

**Example**:
```php
// BEFORE: Wrong type hint
public function store(Request $request): PostResource // ❌ base Request, no validation
{
    $data = $request->payload(); // ❌ payload() called before validation
    // ...
}

// AFTER: Correct type hint
public function store(StorePostRequest $request): PostResource // ✅ FormRequest triggers validation
{
    $data = $request->payload(); // ✅ safe — validation already ran
    // ...
}
```
