# Manual Validator Usage

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Form Requests & Validation
- **Knowledge Unit:** Manual Validator Usage
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Manual validator usage — calling `Validator::make()` directly outside of FormRequests — is required when validation occurs in non-HTTP contexts such as commands, queued jobs, service classes, and domain actions. The `Validator` class is resolved from the container, instantiated with data and rules, and its `passes()`, `fails()`, or `validate()` methods determine the outcome. Manual validation is a necessary escape hatch when the auto-validating FormRequest pattern does not fit the execution context.

---

## Core Concepts

### Validator::make() Factory

The `ValidationFactory::make()` method creates a new Validator instance:

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make(
    $data,           // array of input data
    $rules,          // array of validation rules
    $messages,       // optional custom messages
    $attributes      // optional custom attribute names
);
```

The factory resolves the Validator, injects the presence verifier (for `unique`/`exists`), sets the container (for custom rule resolution), and adds registered extensions.

### Validation Result Methods

- `$validator->passes()` — returns true if all rules pass
- `$validator->fails()` — returns true if any rule fails
- `$validator->validate()` — passes or throws `ValidationException`
- `$validator->validated()` — returns only validated data
- `$validator->errors()` — returns `MessageBag` of errors

### The Validator is Stateless Per-Run

Each `passes()` call constructs the internal `MessageBag` fresh. The Validator can be reused with different data by calling `setData()`.

---

## Mental Models

### The Programmatic Validator

Manual validator usage treats validation as a programmatic step rather than an automatic pipeline. Unlike FormRequests where validation is implicit (triggered by the router), manual validation is explicit — you call `Validator::make()`, then choose what to do with the result. This explicitness is essential in non-HTTP contexts where no router exists to trigger auto-validation.

### The Validation Gate

Think of `Validator::make()` as creating a validation gate that data must pass through. Unlike FormRequests which are tightly coupled to a single HTTP action, a manual validator is a reusable gate that can be applied anywhere data enters the system — from CLI commands, queue jobs, API imports, or service-to-service calls. Each gate encapsulates the rules for a specific data shape, independent of how the data arrived.

---

## Internal Mechanics

### Factory::make() Resolution

From `ValidationFactory`:

```php
public function make(array $data, array $rules, array $messages = [], array $attributes = [])
{
    $validator = $this->resolve($data, $rules, $messages, $attributes);

    if (! is_null($this->verifier)) {
        $validator->setPresenceVerifier($this->verifier);
    }

    if (! is_null($this->container)) {
        $validator->setContainer($this->container);
    }

    $validator->excludeUnvalidatedArrayKeys = $this->excludeUnvalidatedArrayKeys;

    $this->addExtensions($validator);

    return $validator;
}
```

The resolver defaults to `new Validator($translator, $data, $rules, $messages, $attributes)` but can be overridden via `Validator::resolver()`.

### passes() Internal Iteration

```php
public function passes()
{
    $this->messages = new MessageBag;
    [$this->distinctValues, $this->failedRules] = [[], []];

    foreach ($this->rules as $attribute => $rules) {
        if ($this->shouldBeExcluded($attribute)) {
            $this->removeAttribute($attribute);
            continue;
        }
        if ($this->stopOnFirstFailure && $this->messages->isNotEmpty()) {
            break;
        }
        foreach ($rules as $rule) {
            $this->validateAttribute($attribute, $rule);
            // ...
        }
    }

    foreach ($this->after as $after) {
        $after();
    }

    return $this->messages->isEmpty();
}
```

Manual `passes()` follows the exact same loop as FormRequest auto-validation. The difference is who triggers it — the developer calls it explicitly.

---

## Patterns

### Action-Level Validation

In an action class, validate before executing business logic:

```php
class RegisterUserAction
{
    public function __construct(
        private UserService $users,
    ) {}

    public function execute(array $input): User
    {
        $validator = Validator::make($input, [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $this->users->create($validator->validated());
    }
}
```

### Service-Level Validation

Services that accept raw input (from API, CLI, or import) validate early:

```php
class PaymentService
{
    public function processCharge(array $paymentData): Receipt
    {
        $validator = Validator::make($paymentData, [
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'required|string|size:3',
            'source_token' => 'required|string',
        ]);

        $validated = $validator->validate();
        // validated() on success or throws

        return $this->gateway->charge($validated);
    }
}
```

### Queue Job Validation

```php
class ProcessCsvUpload implements ShouldQueue
{
    public function handle(): void
    {
        $validator = Validator::make($this->row, [
            'email' => 'required|email',
            'name' => 'required|string',
        ]);

        if ($validator->fails()) {
            Log::warning('Invalid CSV row', [
                'errors' => $validator->errors(),
                'row' => $this->rowIndex,
            ]);
            $this->fail($validator->errors()->first());
            return;
        }

        User::create($validator->validated());
    }
}
```

### Reusing FormRequest Rules

```php
class ImportUsersAction
{
    public function execute(array $rows): void
    {
        $rules = (new StoreUserRequest)->rules();

        foreach ($rows as $row) {
            $validator = Validator::make($row, $rules);

            if ($validator->fails()) {
                Log::warning('Import row failed', $validator->errors());
                continue;
            }

            User::create($validator->validated());
        }
    }
}
```

Use with caution — FormRequest rules may reference `$this->route()` or `$this->user()`, which are unavailable outside HTTP context.

---

## Architectural Decisions

### Manual Validator vs FormRequest in HTTP Context

Within controllers, always prefer FormRequest auto-validation. Manual validation in controllers reintroduces the boilerplate FormRequests eliminate:

```php
// Avoid in controllers
public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'name' => 'required|string',
    ]);

    if ($validator->fails()) {
        return redirect()->back()->withErrors($validator);
    }
}
```

Use FormRequest in controllers, manual Validator only in non-HTTP contexts.

### validate() vs passes() + Manual Errors

| Context | Method | Behavior |
|---------|--------|----------|
| Controller/API | `validate()` | Throws ValidationException → proper HTTP error response |
| Queue job | `fails()` | Handle gracefully, log, continue |
| CLI command | `fails()` | Output error message, return exit code |
| Service/Action | `validate()` or `fails()` | Depends on desired exception propagation |

In services, prefer `validate()` (throws) unless the caller needs to handle validation errors without exception handling.

---

## Tradeoffs

### Manual Validation vs FormRequest in Controllers

Manual validation in controllers gives fine-grained control over the validation flow — you can catch `ValidationException`, inspect errors, and choose different response formats per action. The tradeoff is boilerplate: every action that validates must repeat the `Validator::make()`, `if ($validator->fails())`, and error-handling logic. FormRequests eliminate this boilerplate but couple the validation to the route's controller method signature.

### Action-Level Validation vs Service-Level Validation

Validating in the action class keeps validation close to the business logic it protects. Validating in the service layer ensures all entry points (HTTP, CLI, queue) receive validated data. The tradeoff is responsibility — action-level validation means each entry point must independently validate, while service-level validation creates a single validation boundary. For applications with multiple input channels, service-level validation is more maintainable despite initial duplication concerns.

---

## Performance Considerations

### Validator Instantiation Overhead For Batch Operations

Each `Validator::make()` call constructs a new Validator instance, parses the rules, registers extensions, and sets up the presence verifier. For batch operations processing thousands of rows (CSV imports, API batch endpoints), this overhead per row is significant. Reuse a single Validator instance by calling `setData()` between rows, which avoids the construction overhead while reusing the parsed rule set.

### Rule Caching Across Validations

The `Validator` instance caches parsed rules internally. Creating a new Validator for each row in a batch resets this cache. For rules that involve expensive parsing (regex patterns, custom rule objects with heavy constructors), the reuse pattern (`setData()` + `passes()`) provides substantial performance improvements.

---

## Production Considerations

### ValidationException in Queued Jobs

Using `$validator->validate()` (which throws on failure) in a queued job will cause the job to fail and potentially retry. In production, use `fails()` with explicit error handling in queue contexts — log the validation failure, skip the invalid record, and continue processing. This prevents a single invalid data point from blocking an entire job queue.

### Consistent Validation Error Formatting

Manual validators in API endpoints should return errors in the same format as FormRequest validation errors. Use a helper or response macro that wraps the validator's `MessageBag` into the standard `{"message": "...", "errors": {...}}` shape. This ensures API consumers receive consistent error structures regardless of whether the validation came from a FormRequest or manual validator.

---

## Common Mistakes

### Duplicating FormRequest Rules

```php
// Controller
public function store(StoreUserRequest $request)
{
    // FormRequest already validates...
}

// Action
class StoreUserAction
{
    public function execute(array $data)
    {
        $validator = Validator::make($data, [
            // ... same rules duplicated from FormRequest
        ]);
    }
}
```

Either validate in the FormRequest (HTTP) or in the action (internal). Not both. Double validation is redundant and creates maintenance burden.

### Missing PresenceVerifier

The `Validator::make()` factory injects the presence verifier automatically. Using `new Validator(...)` directly bypasses this — `unique` and `exists` rules will fail silently without database connectivity. Always use the Facade or factory.

### Ignoring StopOnFirstFailure

Manual `Validator::make()` defaults to `stopOnFirstFailure = false`. For batch validation (e.g., importing rows), enable it to abort early on obviously invalid input:

```php
$validator = Validator::make($data, $rules)
    ->stopOnFirstFailure(true);
```

---

## Failure Modes

### ValidationException in Non-HTTP Context

`$validator->validate()` throws `ValidationException`, which the HTTP handler formats as a JSON/redirect error. In a queue job or CLI command, this exception is unhandled — the job fails, or the command crashes. Always use `fails()` + explicit error handling in non-HTTP contexts.

### Missing Container for Custom Rules

Custom validation rules that resolve dependencies from the container (via `Validator::extend()` class-based resolvers) will fail if the validator lacks a container reference. The factory sets the container automatically; manual `new Validator(...)` does not.

---

## Ecosystem Usage

### Laravel Horizon

Horizon uses manual validators in its queue management tools to validate job payloads before dispatching. The `Horizon\Validation\ValidatesJobPayload` component creates validators for job data that arrives from Redis, ensuring malformed job data is rejected before the worker processes it.

### Laravel Telescope

Telescope uses manual `Validator::make()` calls to validate incoming watcher data and filter entries. The `Telescope\EntryValidator` class validates the structure of monitored events before persisting them, using manual validators because the data arrives from internal application events rather than HTTP requests.

### Laravel Envoy

Envoy uses manual validation for task definitions in its Blade-based deployment scripts. Task inputs that come from CLI arguments are validated through explicit `Validator::make()` calls, since Envoy operates in a CLI context without access to HTTP FormRequest resolution.

---

## Related Knowledge Units

- **Form Request Fundamentals** (this subdomain) — auto-validation flow vs manual
- **Service Class Design** (service-layer-pattern subdomain) — validation in service layer
- **Transactional Actions** (actions-pattern subdomain) — action-level validation

---

## Research Notes

### Validator::make() Facade vs Factory Injection

The `Validator` facade resolves the `ValidationFactory` from the container on every call. In contexts where the container is not available (unit tests, standalone scripts), the static facade fails. Injecting `Illuminate\Validation\Factory` directly through constructor dependency injection is the more portable pattern for packages and libraries that may be used outside the Laravel container.

### Future Direction — Validator Presets

Future Laravel versions could introduce validator presets — pre-configured rule sets that can be applied to any data source. A preset like `Validator::preset('user_registration')` would apply a named set of rules, custom messages, and after-callbacks without requiring the caller to construct the rule array manually. This would bridge the gap between FormRequest convenience and manual validator flexibility.

### Framework Source Reference
- `Illuminate\Validation\Factory::make()` — validator factory
- `Illuminate\Validation\Validator::passes()` — core validation loop
- `Illuminate\Validation\Validator::setData()` — data reuse pattern
- `Illuminate\Support\Facades\Validator` — facade access
