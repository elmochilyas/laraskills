# Anti-Patterns — After Validation Hooks

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Knowledge Unit | After Validation Hooks |
| Difficulty | Advanced |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| passedValidation as Dumping Ground | High | Medium | Code review: multiple unrelated transformations in one hook |
| Side Effects in passedValidation | Critical | Medium | Code review: DB writes, job dispatches, emails in validation |
| after Callback Without Error Check | High | Medium | Code review: `after()` adds errors even when primary validation failed |
| External API Calls Without Timeout | High | Low | Code review: `Http::post()` in `after()` without `timeout()` |
| Modifying Validated Data After Hooks | Medium | Low | Code review: overwriting validated keys after `passedValidation()` |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| DB Writes in passedValidation | Creating records or updating DB during validation | Data created even when downstream logic fails — orphaned records |
| Logging Without Context in after | Logging errors without trace_id or request context | Cannot correlate failed external validation to specific requests |
| Using after for All Complex Rules | Every complex validation dumped into a single `after()` callback | Monolithic, untestable, unmaintainable validation logic |

---

## Anti-Pattern Details

### AP-AVH-01: passedValidation as Dumping Ground

**Description**: The `passedValidation()` method accumulates multiple unrelated transformations — slug generation, total calculation, audit field injection, data normalization, and cross-field mapping all in one method. The hook becomes unreadable, untestable, and prone to ordering bugs when transformations interact.

**Root Cause**: Convenience. The developer treats `passedValidation()` as the one place to put all post-validation logic because it runs at the right time.

**Impact**:
- Transformations cannot be tested independently
- Order-dependent bugs when two transformations touch the same data
- New developers add more transformations without understanding existing ones
- Logic cannot be reused across different FormRequests

**Detection**:
- Code review: `passedValidation()` with 5+ `merge()` calls
- Code review: multiple transformations in one method without extraction to named methods
- Test review: test for `passedValidation()` covers entire method, not individual transformations

**Solution**:
- Extract each transformation to a named method: `generateSlug()`, `computeTotal()`, `injectAuditFields()`
- Call each named method from `passedValidation()` in order
- Keep `passedValidation()` as a coordinator, not a logic container

**Example**:
```php
// BEFORE: Dumping ground
protected function passedValidation(): void
{
    $this->merge([
        'slug' => Str::slug($this->input('title')),
        'total' => $this->input('quantity') * $this->input('price'),
        'created_by' => $this->user()->id,
        'email' => strtolower($this->input('email')),
        'status' => $this->input('status', 'draft'),
    ]);
}

// AFTER: Extracted to named methods
protected function passedValidation(): void
{
    $this->generateSlug();
    $this->computeTotal();
    $this->injectAuditFields();
}

protected function generateSlug(): void
{
    $this->merge(['slug' => Str::slug($this->input('title'))]);
}

protected function computeTotal(): void
{
    $this->merge(['total' => $this->input('quantity') * $this->input('price')]);
}

protected function injectAuditFields(): void
{
    $this->merge(['created_by' => $this->user()->id]);
}
```

---

### AP-AVH-02: Side Effects in passedValidation

**Description**: The `passedValidation()` hook performs database writes, dispatches queued jobs, sends emails, or calls external APIs. Since validation may pass but the controller or service layer may later fail (business logic rejection, database error), these side effects create orphaned records, duplicate operations, or inconsistent state.

**Root Cause**: Convenience. The developer needs to perform an action after validation passes and places it in `passedValidation()` because it runs at the right time in the request lifecycle.

**Impact**:
- Orphaned records when the controller throws after validation
- Duplicate job dispatches on retry logic
- Emails sent for requests that ultimately fail business logic checks
- Database transactions cannot wrap validation + controller logic

**Detection**:
- Code review: Eloquent queries, `dispatch()`, `Mail::send()`, or `Http::post()` in `passedValidation()`
- Code review: `DB::table()` or model `save()` calls in validation hooks
- Bug reports: duplicate entries or orphaned data on validation-pass but controller-fail

**Solution**:
- Keep `passedValidation()` free of I/O — in-memory transformations only
- Move DB writes, job dispatches, and API calls to the controller or service layer
- Use the controller or service to coordinate validation results with side effects

**Example**:
```php
// BEFORE: Side effects in validation
protected function passedValidation(): void
{
    Log::info('Order validated', ['order' => $this->validated()]);
    Dispatch::new SendOrderConfirmation($this->validated()); // ❌ side effect
    $this->merge(['validated_at' => now()]);
}

// AFTER: In-memory only
protected function passedValidation(): void
{
    $this->merge(['validated_at' => now()]); // ✅ in-memory only
}

// Side effect moved to controller/service:
public function store(StoreOrderRequest $request, OrderService $orders): JsonResponse
{
    $order = $orders->create($request->payload());
    SendOrderConfirmation::dispatch($order); // ✅ side effect after successful creation
    return OrderResource::make($order);
}
```

---

### AP-AVH-03: after Callback Without Error Check

**Description**: The `Validator::after()` callback adds errors to the validator without first checking whether primary validation already failed. In Laravel 10+, `after()` callbacks run even when validation fails. The callback adds redundant cross-field errors on top of already-failed field rules, producing confusing multi-error responses that mask the root cause.

**Root Cause**: Assuming `after()` only runs on pass. The developer wrote the logic before understanding that Laravel 10+ changed the lifecycle.

**Impact**:
- Validation error responses contain redundant messages
- Primary validation failures are buried under after-hook errors
- Cross-field validation errors appear for requests that already failed field-level checks
- Log noise from after-hook failures on already-invalid requests

**Detection**:
- Code review: `$validator->after(function ($validator) { ... })` without `$validator->errors()->isEmpty()` check
- Code review: after-hooks that unconditionally add errors
- Integration tests: 422 response shows cross-field errors alongside field-level errors for the same fields

**Solution**:
- Always check `$validator->errors()->isEmpty()` at the start of `after()` callbacks
- Return early if primary validation already failed
- Keep after-hook logic guarded by the emptiness check

**Example**:
```php
// BEFORE: No error check
$validator->after(function ($validator) {
    if ($this->input('start_date') > $this->input('end_date')) {
        $validator->errors()->add('start_date', 'Start must be before end.'); // ❌ adds error even if fields themselves are invalid
    }
});

// AFTER: Guarded by error check
$validator->after(function ($validator) {
    if ($validator->errors()->isNotEmpty()) {
        return; // ✅ primary validation already failed — skip cross-field checks
    }
    if ($this->input('start_date') > $this->input('end_date')) {
        $validator->errors()->add('start_date', 'Start must be before end.');
    }
});
```

---

### AP-AVH-04: External API Calls Without Timeout

**Description**: The `Validator::after()` callback makes external HTTP requests (fraud checks, blacklist verification, address validation) without setting a timeout. If the external service hangs, the validation callback blocks the request indefinitely, tying up PHP-FPM workers or event-loop threads. A slow external service cascades into API-wide latency.

**Root Cause**: Trusting external service reliability. The developer assumes the third-party API always responds quickly.

**Impact**:
- Request hangs indefinitely when external service is slow or down
- PHP-FPM worker pool exhaustion from stuck validation callbacks
- API-wide timeout cascade when one external service degrades
- Poor user experience: 30+ second response times for simple form submissions

**Detection**:
- Code review: `Http::post()` or `Http::get()` in `after()` without `timeout()` chain
- Code review: Guzzle client instantiation with default timeout (100 seconds)
- Performance monitoring: validation latency outliers correlating with external service degradation

**Solution**:
- Always set explicit timeouts (2-3 seconds) on external API calls in validation
- Wrap external calls in try/catch to prevent unhandled exceptions
- Consider queueing external validation for non-blocking flows

**Example**:
```php
// BEFORE: No timeout
$validator->after(function ($validator) {
    $response = Http::post('https://fraud.example.com/check', [
        'email' => $this->input('email'),
    ]); // ❌ no timeout — blocks indefinitely
    // ...
});

// AFTER: With timeout and error handling
$validator->after(function ($validator) {
    if ($validator->errors()->isNotEmpty()) {
        return;
    }
    try {
        $response = Http::timeout(3)->post('https://fraud.example.com/check', [
            'email' => $this->input('email'),
            'amount' => $this->input('amount'),
        ]);
        if ($response->json('risk_score') > 80) {
            $validator->errors()->add('email', 'Transaction flagged as high risk.');
        }
    } catch (Throwable $e) {
        Log::warning('Fraud check failed', ['error' => $e->getMessage()]); // ✅ fail open
    }
});
```

---

### AP-AVH-05: Modifying Validated Data After Hooks

**Description**: After `passedValidation()` completes and `validated()` has been called elsewhere, the code modifies the validated data array — directly changing values that the validator already checked. This defeats the purpose of validation: downstream code receives data that doesn't match the validation rules it passed.

**Root Cause**: Misunderstanding the validation lifecycle. The developer calls `$this->merge()` or modifies request data after `passedValidation()`, believing it will still be reflected in `validated()`.

**Impact**:
- Validated data contains values that never passed validation rules
- Security: a field validated as `string|max:255` could be overwritten with a 10000-character string
- Downstream bugs are hard to trace — the validated contract is violated
- Validation rules and actual data diverge silently

**Detection**:
- Code review: `merge()` calls outside `prepareForValidation()` or `passedValidation()`
- Code review: `$this->request->set()` or direct `$this->offsetSet()` after hook methods
- Integration tests: data reaching the controller doesn't match what was validated

**Solution**:
- Only modify request data in `prepareForValidation()` (pre-validation) or `passedValidation()` (post-validation)
- In `passedValidation()`, add new keys — never overwrite existing validated keys
- Never call `merge()` or modify data after the hook methods complete

**Example**:
```php
// BEFORE: Modifying data after hooks
protected function passedValidation(): void
{
    $this->merge(['slug' => Str::slug($this->input('title'))]);
}

// Elsewhere in controller:
$validated = $request->validated();
$validated['slug'] = 'something-else'; // ❌ overwrites validated data

// AFTER: All modifications in the hook, none downstream
// In passedValidation:
protected function passedValidation(): void
{
    $this->merge(['slug' => Str::slug($this->input('title'))]);
}

// In controller: use validated() as-is
$data = $request->payload(); // ✅ DTO already has the correct slug
```
