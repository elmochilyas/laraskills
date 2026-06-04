# After Validation Hooks

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Form Requests & Validation
- **Knowledge Unit:** After Validation Hooks
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

After-validation hooks give FormRequests the ability to mutate the validator before validation runs, react to successful validation, and intercept validation failures. The three primary hooks — `withValidator()`, `passedValidation()`, and `failedValidation()` — fire at specific points in the `validateResolved()` pipeline. A fourth mechanism, `Validator::after()`, registers callbacks that execute after the main rule pass, enabling cross-field validation and post-rule assertions.

---

## Core Concepts

### The Three FormRequest Hooks

| Hook | Timing | Purpose |
|------|--------|---------|
| `withValidator()` | After validator constructed, before `passes()` | Mutate rules, add `after()` callbacks, inject data |
| `passedValidation()` | After all rules pass | Post-validation side effects, data transformation |
| `failedValidation()` | After rule failure | Custom error response, logging |

### Validator::after() Callbacks

The `after()` method on the Validator registers callbacks that fire after the main rule iteration:

```php
$validator->after(function ($validator) {
    if ($this->someCondition()) {
        $validator->errors()->add('field', 'Custom error.');
    }
});
```

Multiple `after()` callbacks can be registered. They execute in registration order.

---

## Mental Models

### The Lifecycle Timeline

Think of the FormRequest as a processing pipeline with three gates: pre-validation (prepareForValidation), authorization, and validation. After-validation hooks are the "what happens next" layer. `withValidator()` is the setup phase where you tune the validator before it runs. `passedValidation()` is the success callback. `failedValidation()` is the error handler. Each hook has a precise firing order, and understanding this timeline is key to using them correctly.

### The Event Listener Analogy

Each hook behaves like an event listener scoped to the validation lifecycle. `withValidator()` listens for "validator constructed" and mutates the validator object. `passedValidation()` listens for "all rules passed" and triggers side effects. `failedValidation()` listens for "rules failed" and customizes the error output. This mental model helps separate setup logic (withValidator) from success logic (passedValidation) from failure logic (failedValidation).

---

## Internal Mechanics

### Hook Execution in validateResolved()

```php
public function validateResolved()
{
    $this->prepareForValidation();

    if (! $this->passesAuthorization()) {
        $this->failedAuthorization();
    }

    $instance = $this->getValidatorInstance();
    // Inside getValidatorInstance():
    //   withValidator($validator) is called
    //   validator->after() is called if method exists

    if ($instance->fails()) {
        $this->failedValidation($instance);
    }

    $this->passedValidation();
}
```

Note: `withValidator()` fires during `getValidatorInstance()`, which is called INSIDE `validateResolved()`. `after()` callbacks are registered inside `withValidator()` but execute during `$instance->fails()` → `Validator::passes()` → AFTER the main rule loop.

### The after() Callback Queue

The `Validator::after` property is an array of closures:

```php
public function after($callback)
{
    if (is_array($callback) && ! is_callable($callback)) {
        foreach ($callback as $rule) {
            $this->after(method_exists($rule, 'after') ? $rule->after(...) : $rule);
        }
        return $this;
    }

    $this->after[] = fn () => $callback($this);
    return $this;
}
```

During `Validator::passes()`, after the main rule loop completes:

```php
public function passes()
{
    // ... main rule iteration loop ...

    // Here we will spin through all of the "after" hooks
    foreach ($this->after as $after) {
        $after();
    }

    return $this->messages->isEmpty();
}
```

Key detail: `after()` callbacks fire even when main rules fail. The validator accumulates errors from both phases. This means `after()` callbacks can add errors on top of existing rule failures — useful for cross-field checks that should run regardless.

### passedValidation() Hook

```php
protected function passedValidation()
{
    // Default: no-op
}
```

This hook fires only when `$instance->fails()` returns false. It can mutate the request or perform side effects like logging:

```php
protected function passedValidation(): void
{
    $this->merge(['validated_at' => now()]);
}
```

### failedValidation() Override

The default implementation:

```php
protected function failedValidation(Validator $validator)
{
    $exception = $validator->getException();
    throw (new $exception($validator))
        ->errorBag($this->errorBag)
        ->redirectTo($this->getRedirectUrl());
}
```

The `$validator->getException()` returns `ValidationException::class` by default but can be customized if the validator was created with a custom exception class.

---

## Patterns

### withValidator() for Cross-Field Rules

```php
public function withValidator(Validator $validator): void
{
    $validator->after(function (Validator $validator) {
        if ($this->start_date >= $this->end_date) {
            $validator->errors()->add('end_date', 'End date must be after start date.');
        }
    });
}
```

The `after()` closure inside `withValidator()` runs after all individual field rules pass. This is the preferred pattern for cross-field validation.

### withValidator() for Dynamic Rule Adding

```php
public function withValidator(Validator $validator): void
{
    $validator->sometimes('tax_rate', 'required|numeric|min:0', function (Input $input) {
        return $input->has('billing_address');
    });
}
```

`sometimes()` inside `withValidator()` adds conditional rules that fire during the main validation pass.

### passedValidation() for Audit Logging

```php
protected function passedValidation(): void
{
    Log::info('Valid submission', [
        'action' => static::class,
        'user_id' => $this->user()?->id,
    ]);
}
```

Use for non-critical side effects that should not block the response. Do NOT dispatch jobs here — use the controller or action instead.

### failedValidation() for Custom API Responses

```php
protected function failedValidation(Validator $validator): void
{
    if ($this->expectsJson()) {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422)
        );
    }

    parent::failedValidation($validator);
}
```

Override `failedValidation()` to customize the error format without modifying the global exception handler.

---

## Architectural Decisions

### withValidator() vs Overriding rules()

`withValidator()` mutates the already-constructed validator. Overriding `rules()` changes the input to the validator constructor. The difference matters for `sometimes()` — `sometimes()` registers callbacks on the validator, while `rules()` runs before the validator exists.

Use `rules()` for static rule definitions. Use `withValidator()` for dynamic adjustments that depend on the validator instance.

### after() Callback vs Custom Validation Rule

| Aspect | after() callback | Custom ValidationRule |
|--------|-----------------|----------------------|
| Reusability | Per-request | Any FormRequest |
| DI | Container available | Constructor injection |
| Testability | Inline in FormRequest test | Standalone unit test |
| Cross-field | Direct access to all errors | Single attribute focus |
| Error granularity | Manual error bag | Per-field $fail call |

Use `after()` for cross-field validation specific to one request type. Extract to a custom rule when the logic is reused across requests.

---

## Tradeoffs

### withValidator() vs Direct Validator Customization

Using `withValidator()` keeps the FormRequest self-contained — all validation logic lives in one class. The tradeoff is that `withValidator()` runs inside `getValidatorInstance()`, which is called during `validateResolved()`. If you override `validator()` entirely, `withValidator()` is never called. Direct customization via a custom `validator()` method gives complete control but loses the hook's automatic invocation benefits.

### after() Callback vs Multiple FormRequests

Cross-field validation in an `after()` callback is convenient for localized rules that apply to a single request. The tradeoff emerges when the same cross-field logic is needed across multiple FormRequests — duplicating the `after()` callback violates DRY, but extracting it to a shared trait or custom rule creates a dependency. For logic shared across 3+ requests, extract to a custom validation rule class instead.

---

## Common Mistakes

### Throwing Exceptions in after()

```php
$validator->after(function ($validator) {
    throw new \RuntimeException('Something went wrong');
});
```

Exceptions thrown in `after()` callbacks are not caught by the Validator — they bubble up to the exception handler. Use `$validator->errors()->add()` instead.

### Modifying Request Data in passedValidation()

```php
protected function passedValidation(): void
{
    $this->merge(['password' => bcrypt($this->password)]);
}
```

The FormRequest is already resolved by this point. The controller may have already received the request object. Mutations in `passedValidation()` are not guaranteed to reach the controller. Use `prepareForValidation()` for data transformation.

### Registering after() in the Wrong Place

```php
// WRONG — outside withValidator()
public function rules(): array
{
    return [
        'email' => 'required|email',
        'confirm_email' => 'required|email',
    ];
}

public function messages(): array
{
    return [
        'email.required' => 'Email is required.',
    ];
}

// after() should be in withValidator()
public function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        if ($this->email !== $this->confirm_email) {
            $validator->errors()->add('confirm_email', 'Emails must match.');
        }
    });
}
```

`after()` must be registered inside `withValidator()` because the Validator object is not available in `rules()` or `messages()`.

---

## Performance Considerations

`after()` callbacks run after all field-level validation. If the field-level validation fails, `after()` callbacks still execute, potentially doing database queries for a request that is already invalid. Guard expensive after-callbacks with an early check:

```php
$validator->after(function ($validator) use ($expensiveService) {
    if ($validator->errors()->isNotEmpty()) {
        return; // Don't run expensive check if fields already invalid
    }
    $expensiveService->validate($this->all());
});
```

### Hook Overhead

Each hook method call (`withValidator()`, `passedValidation()`, `failedValidation()`) incurs a method resolution cost via the container. For standard FormRequests this overhead is negligible, but if you have deep inheritance chains where each level defines hooks, multiple parent `withValidator()` calls stack up. Keep hook implementations lean and avoid chaining multiple hook calls unnecessarily.

---

## Production Considerations

### Error Response Consistency

Override `failedValidation()` to ensure consistent error structures across API versions or client types. A common production pattern is to return structured JSON errors with error codes rather than raw validation messages. This prevents clients from needing to parse unpredictable message strings.

### Logging Validation Failures

In production, validation failures can signal malicious probing or misconfigured clients. Use `failedValidation()` to log structured failure data without exposing internal details in the response. Attach request IDs, user identifiers, and failure counts to your monitoring system for anomaly detection.

### Hook Idempotency

`passedValidation()` can be called multiple times if validation is re-run. Ensure any side effects in `passedValidation()` are idempotent — dispatching a job or incrementing a counter should guard against duplicate execution. Use the `once()` method or a flag property to prevent double-firing.

---

## Failure Modes

### Silent Failure in passedValidation()

If `passedValidation()` throws an exception, it is not caught by the FormRequest — it propagates as a 500 error. Keep `passedValidation()` side-effect-free or wrap in try/catch.

### after() Not Firing

If the validator is replaced via the `validator()` method override (not `createDefaultValidator()`), the `withValidator()` and `after()` hooks may not fire because `getValidatorInstance()` returns early. Any custom `validator()` method must call `withValidator()` and `after()` manually.

---

## Ecosystem Usage

### Laravel Nova

Nova's resource validation uses `withValidator()` internally to apply its own cross-field validation rules before the standard validation pass. Nova action forms also leverage `after()` callbacks to validate complex interdependent fields that are common in admin panel workflows.

### Laravel Jetstream

Jetstream uses `passedValidation()` in its team management FormRequests to log audit events after successful validation. The `failedValidation()` override is used in Jetstream's API token creation flow to return structured JSON errors that the Inertia frontend can parse for inline field errors.

### Laravel Spark

Spark's billing FormRequests override `failedValidation()` to return payment-specific error messages rather than generic validation errors. The `withValidator()` hook is used extensively to add subscription-tier-aware validation rules that depend on the authenticated user's plan.

---

## Related Knowledge Units

- **Conditional Validation** (this subdomain) — sometimes() and after() for cross-field logic
- **Input Preparation** (this subdomain) — prepareForValidation() for pre-validation transforms
- **Form Request Fundamentals** (this subdomain) — the validation pipeline

---

## Research Notes

### Hook Execution Guarantees

The current implementation calls `withValidator()` inside `getValidatorInstance()` after the validator is created but before `setValidator()` persists it. If the validator creation is overridden via the `validator()` method, `withValidator()` is skipped entirely — this is an important edge case to document when providing custom validator instances.

### Future Direction — After Hooks as Events

As Laravel moves toward event-driven architecture, after-validation hooks could be refactored into dispatched events. `passedValidation()` and `failedValidation()` are natural candidates for event-driven replacement, enabling multiple listeners without overriding the FormRequest. This would decouple side effects from the request class and improve testability.

### Framework Source Reference
- `Illuminate\Foundation\Http\FormRequest` — withValidator(), passedValidation(), failedValidation()
- `Illuminate\Validation\Validator::passes()` — after() callback execution
- `Illuminate\Validation\ValidatesWhenResolvedTrait::validateResolved()` — pipeline order
