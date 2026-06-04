# After Validation Hooks — Anti-Patterns

## Anti-Pattern 1: Business Logic in passedValidation()

**Symptom:** Creating records, sending emails, dispatching jobs, or calling external APIs inside `passedValidation()`.

**Problem:** `passedValidation()` runs on every successful validation. Heavy operations here slow every valid submission and violate separation of concerns — business logic hidden inside validation hooks is hard to find, test, and maintain.

```php
// BAD — business logic in validation hook
protected function passedValidation(): void
{
    Mail::to($this->user())->send(new WelcomeMail());
    $this->user()->increment('login_count');
    Invoice::create($this->validated());
}
```

**Solution:** Move business operations to the controller, service, or action layer. Keep `passedValidation()` only for lightweight request-level metadata.

```php
// GOOD — lightweight, validation-only hook
protected function passedValidation(): void
{
    $this->merge(['validated_at' => now()]);
}

// Controller handles business logic
public function store(StoreInvoiceRequest $request, CreateInvoiceAction $action)
{
    return $action->execute($request->payload());
}
```

**Detection:** Search for `DB::`, `Mail::`, `dispatch`, `Queue::`, `::create`, `::update` inside `passedValidation()` methods.

---

## Anti-Pattern 2: Throwing Exceptions in after() Callbacks

**Symptom:** Using `throw` instead of `$validator->errors()->add()` inside `Validator::after()` callbacks.

**Problem:** Exceptions thrown in `after()` callbacks are not caught by the Validator — they bubble up as 500 errors instead of validation errors. The user receives no field-specific feedback.

```php
// BAD — exception bypasses validation error handling
$validator->after(function ($validator) {
    if ($this->start_date >= $this->end_date) {
        throw new \RuntimeException('End date must be after start date.');
    }
});
```

**Solution:** Use `$validator->errors()->add()` to attach errors to specific fields. This produces proper validation error responses.

```php
// GOOD — proper validation error
$validator->after(function ($validator) {
    if ($this->start_date >= $this->end_date) {
        $validator->errors()->add('end_date', 'End date must be after start date.');
    }
});
```

**Detection:** Search for `throw` inside `$validator->after(function` or `->after(fn`.

---

## Anti-Pattern 3: Mutating Request Data in after() Callbacks

**Symptom:** Calling `$this->merge()` inside an `after()` callback, expecting the merged data to appear in `validated()`.

**Problem:** `after()` callbacks fire during `$instance->fails()`, after the main rule loop has completed. The validated result is already computed. Merged data silently disappears from `validated()` output.

```php
// BAD — mutation invisible
$validator->after(function ($validator) {
    $this->merge(['computed' => someCalculation()]);
});

public function store(StoreRequest $request)
{
    $request->validated(); // 'computed' is NOT here
}
```

**Solution:** Use `prepareForValidation()` for any data transformation that must appear in `validated()`.

```php
// GOOD — mutation in the right hook
protected function prepareForValidation(): void
{
    $this->merge(['computed' => someCalculation()]);
}
```

**Detection:** Search for `$this->merge` inside `$validator->after(function` or `->after(fn`.

---

## Anti-Pattern 4: Overriding validator() Instead of Using withValidator()

**Symptom:** Completely replacing the `validator()` method to add custom logic, losing default FormRequest behavior.

**Problem:** The `validator()` method constructs the entire Validator. Overriding it bypasses automatic message customization, attribute name resolution, and custom resolver injection that the framework provides.

```php
// BAD — loses default FormRequest behavior
public function validator()
{
    $validator = Validator::make($this->all(), $this->rules());
    $validator->after(function ($validator) {
        // cross-field check
    });
    return $validator;
}
```

**Solution:** Use `withValidator()` for targeted modifications. Only override `validator()` when you need to completely replace the validator class.

```php
// GOOD — preserves defaults
public function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        // cross-field check
    });
}
```

**Detection:** Search for `public function validator()` in FormRequest classes. Flag any usage for review.

---

## Anti-Pattern 5: Database Queries in withValidator()

**Symptom:** Loading models, querying databases, or calling external services inside `withValidator()`.

**Problem:** `withValidator()` fires during `getValidatorInstance()`, which is called inside `validateResolved()` — before `authorize()` runs. Database queries here execute even on requests that will be rejected by authorization, wasting resources.

```php
// BAD — DB query before authorization
public function withValidator(Validator $validator): void
{
    $user = User::with('subscriptions')->find($this->user()->id);
    $settings = Setting::where('user_id', $this->user()->id)->first();
}
```

**Solution:** Defer I/O operations to `after()` callbacks or the service layer. Keep `withValidator()` for configuration only.

```php
// GOOD — configuration only
public function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        // I/O here if needed, or in service layer
    });
}
```

**Detection:** Search for `::find`, `::where`, `::first`, `DB::`, `Http::`, `::query` inside `withValidator()` methods.

---

## Anti-Pattern 6: Silent Failure in failedValidation()

**Symptom:** Overriding `failedValidation()` to return a custom response without throwing, or catching and swallowing the exception.

**Problem:** If `failedValidation()` does not throw, the pipeline continues with un-validated data reaching the controller. The validation failure is silently ignored.

```php
// BAD — doesn't halt execution
protected function failedValidation(Validator $validator)
{
    Log::warning('Validation failed', $validator->errors()->all());
    // No throw — pipeline continues!
}
```

**Solution:** Always throw `HttpResponseException` or call `parent::failedValidation()` in overrides to halt the pipeline.

```php
// GOOD — halts execution
protected function failedValidation(Validator $validator)
{
    throw new HttpResponseException(response()->json([
        'success' => false,
        'errors' => $validator->errors(),
    ], 422));
}
```

**Detection:** Search for `protected function failedValidation`. Verify each override throws an exception.

---

## Anti-Pattern 7: Not Checking fails() Before Expensive after() Callbacks

**Symptom:** Running expensive database queries or API calls in `after()` callbacks even when field-level validation already failed.

**Problem:** `after()` callbacks fire even when main rules fail. Without an early return check, expensive operations execute on already-invalid data.

```php
// BAD — expensive check runs even on invalid input
$validator->after(function ($validator) use ($expensiveService) {
    $result = $expensiveService->validate($this->all()); // Runs even if fields invalid
    if (! $result) {
        $validator->errors()->add('field', 'Invalid.');
    }
});
```

**Solution:** Guard expensive `after()` callbacks with an early check.

```php
// GOOD — skip if already invalid
$validator->after(function ($validator) use ($expensiveService) {
    if ($validator->errors()->isNotEmpty()) {
        return;
    }
    $result = $expensiveService->validate($this->all());
});
```

**Detection:** Search for `->after(function` and inspect for expensive operations (DB calls, API calls) without early `errors()->isNotEmpty()` checks.
