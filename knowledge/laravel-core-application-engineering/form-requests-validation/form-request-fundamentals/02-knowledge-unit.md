# Form Request Fundamentals

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Form Requests & Validation
- **Knowledge Unit:** Form Request Fundamentals
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Form Requests are Laravel's mechanism for encapsulating HTTP input validation and authorization into dedicated, autoloaded classes. They implement the `ValidatesWhenResolved` contract, which triggers validation automatically when the request is resolved from the container via the controller method's type-hint. This removes validation logic from controllers and ensures that every action receives pre-validated, authorized input.

The engineering significance of Form Requests is that they establish a clear validation boundary at the HTTP layer. The controller never sees invalid data — the request throws `ValidationException` before the controller method executes. This eliminates the need for if/else validation checks in controllers and provides a single source of truth for input rules per action.

---

## Core Concepts

### The ValidatesWhenResolved Contract

`FormRequest` extends `Request` and implements `Illuminate\Contracts\Validation\ValidatesWhenResolved`. The contract defines a single method: `validateResolved()`. Laravel's `Router` calls this method on any resolved dependency that implements the contract, immediately after instantiation and before passing the resolved class to the controller.

### Auto-Validation Pipeline

When a controller method type-hints a FormRequest, Laravel's service container:
1. Resolves the FormRequest from the container (injecting the current request data)
2. Calls `validateResolved()` — this triggers the full validation pipeline
3. If validation fails, `ValidationException` is thrown — the controller never executes
4. If validation passes, the validated FormRequest instance is passed to the controller

### The Method Contract

A FormRequest defines at minimum:
- `rules()` — returns the validation rules array
- `authorize()` — returns bool, determines if the user can make this request

Optional overrides:
- `messages()` — custom error messages per rule
- `attributes()` — human-readable field name replacements
- `validationData()` — the data array to validate (defaults to `$this->all()`)

---

## Mental Models

### The Gatekeeper

The FormRequest stands at the controller door. Every request must satisfy its rules and pass its authorization check before the controller is allowed to execute. The controller can trust that any data it receives from the request is valid.

### The Contract

A FormRequest is a contract between the client and the controller. It declares: "If you send data in this shape, with these constraints, I guarantee only valid data reaches the action." Changing the FormRequest's rules changes the API contract.

### The Firewall

FormRequests are the outermost validation layer — they protect the application from malformed, missing, or unauthorized input at the HTTP boundary. Internal layers (services, actions, domain) operate on data that is structurally guaranteed to be valid.

---

## Internal Mechanics

### FormRequest Autoloading

`FormRequest` does not register itself as a validation target. The `Router` is responsible for triggering validation on resolved `ValidatesWhenResolved` instances:

```php
// Illuminate\Routing\Router — during controller dispatch
$parameters = $this->resolveMethodDependencies(
    $route->parametersWithoutNulls(), $instance, $method
);

// Before passing to controller, validate resolved instances...
foreach ($parameters as $parameter) {
    if ($parameter instanceof ValidatesWhenResolved) {
        $parameter->validateResolved();
    }
}
```

### validateResolved() Execution Order

The trait `ValidatesWhenResolvedTrait` defines the exact pipeline:

```
prepareForValidation()
  → passesAuthorization() → [false] → failedAuthorization() → throws
  → getValidatorInstance()
    → [isPrecognitive()] → attaches precognition hook
  → fails() → [true] → failedValidation() → throws
  → passedValidation()
```

Key ordering details:
- `prepareForValidation()` runs BEFORE authorization — this allows data normalization before the auth check
- Authorization runs BEFORE rule validation — an unauthorized user never has their input validated
- `passedValidation()` only runs when all rules pass

### getValidatorInstance() Internal Flow

The validator factory method has important caching and override logic:

```php
// FormRequest
protected function getValidatorInstance()
{
    if ($this->validator) {
        return $this->validator;  // cached — only builds once
    }

    $factory = $this->container->make(ValidationFactory::class);

    if (method_exists($this, 'validator')) {
        // Custom validator() method — complete override
        $validator = $this->container->call([$this, 'validator'], compact('factory'));
    } else {
        $validator = $this->createDefaultValidator($factory);
    }

    if (method_exists($this, 'withValidator')) {
        $this->withValidator($validator);  // mutation hook
    }

    if (method_exists($this, 'after')) {
        $validator->after($this->container->call($this->after(...), ['validator' => $validator]));
    }

    $this->setValidator($validator);
    return $this->validator;
}
```

The `validator()` method override is rarely used but provides complete control — the returned validator replaces the default entirely. The `withValidator()` hook allows mutation of the validator object after construction but before validation runs.

### Rule Resolution Through Container

Both `rules()` and `authorize()` are resolved through the container:

```php
// FormRequest
protected function validationRules()
{
    return method_exists($this, 'rules')
        ? $this->container->call([$this, 'rules'])
        : [];
}
```

This means constructor-injected dependencies are available inside `rules()`. A FormRequest can inject services in its constructor and use them to build conditional rules.

### ValidationException Format

When validation fails, `failedValidation()` creates and throws a `ValidationException`:

```php
protected function failedValidation(Validator $validator)
{
    $exception = $validator->getException();
    throw (new $exception($validator))
        ->errorBag($this->errorBag)
        ->redirectTo($this->getRedirectUrl());
}
```

The redirect URL is resolved from `$redirect`, `$redirectRoute`, `$redirectAction` properties, or falls back to `url()->previous()`.

### String vs Array Rule Syntax

The `ValidationRuleParser::parse()` method handles both syntaxes:

- String: `'required|max:255'` — split on `|`, then split on `:` for parameters
- Array: `['required', 'max:255']` — each element is a rule; objects are passed through directly

For string rules, `parseStringRule()` uses `explode(':', $rule, 2)`. Parameters are parsed with `str_getcsv()` for comma-separated values EXCEPT for regex rules, where the full parameter is preserved as-is.

---

## Patterns

### Per-Action FormRequests

The dominant pattern is one FormRequest per controller action:

```
app/Http/Requests/
├── StoreUserRequest.php
├── UpdateUserRequest.php
└── UpdateUserPasswordRequest.php
```

Each class is named for the specific action validation it performs. This keeps rule changes isolated and prevents unrelated actions from sharing rule modifications.

### Inheritance for Shared Rules

When multiple actions share validation rules, extract the common rules into a base class:

```php
class UserRequest extends FormRequest
{
    public function commonRules(): array
    {
        return ['email' => 'required|email|unique:users,email'];
    }
}

class StoreUserRequest extends UserRequest
{
    public function rules(): array
    {
        return array_merge($this->commonRules(), [
            'password' => 'required|min:8',
        ]);
    }
}
```

### Public Properties Pattern

Avoid storing validated data in FormRequest public properties. The request's lifecycle is per-request — it should validate and transport, not persist state.

---

## Architectural Decisions

### FormRequest vs Manual Validation in Controller

| Aspect | FormRequest | Controller `$this->validate()` |
|--------|------------|-------------------------------|
| Reusability | Reusable across actions | Per-controller only |
| Testability | Standalone methods | Coupled to controller test |
| Controller surface | Zero validation code | Validation interleaved with logic |
| Override hooks | 6+ override points | None |
| Authorization | Built-in `authorize()` | Manual Gate calls |
| Rule complexity | Constructor DI available | Facade/hard-coded only |

The threshold for extracting a FormRequest is roughly 2+ rules or any authorization logic. A single `$request->validate(['name' => 'required|string'])` in a controller is acceptable for trivial endpoints.

### Version Evolution

- **Laravel 5.5+**: `safe()` method added — returns `ValidatedInput` supporting `->only()`, `->all()`
- **Laravel 9+**: `validated()` accepts optional key parameter (`$request->validated('email')`)
- **Laravel 11+**: PHP 8 attributes `#[StopOnFirstFailure]`, `#[ErrorBag]`, `#[RedirectTo]`, `#[FailOnUnknownFields]` replace magic properties
- **Laravel 12+**: Precognition support in FormRequest for validation-before-submit workflows

---

## Tradeoffs

### FormRequest vs Request-level Validate
FormRequests are a formal abstraction with constructor injection, authorization, and mutation hooks. `$request->validate()` is inline and immediate. FormRequests cost one file per action but provide isolation, testing, and reuse. Use FormRequests for anything beyond trivial single-rule endpoints.

### Inheritance Depth
Deep inheritance chains for shared rules create fragility — a change in a grandparent FormRequest affects all descendants. Prefer shallow inheritance (one level) or trait composition over deep hierarchies.

### ValidationData Override
`validationData()` defaults to `$this->all()`. Overriding it to filter input is a valid pattern but risks data mismatch — the controller and FormRequest must agree on which fields are being validated.

---

## Performance Considerations

FormRequest instances are resolved per-request. The validation rules array is built fresh each time — there is no caching of rule definitions. For rules that never change (static arrays), consider moving them to a constant or cached configuration.

The `Validator::passes()` method's performance depends on rule complexity. String parsing via `ValidationRuleParser::parse()` happens per-rule per-attribute per-request. For high-traffic endpoints with many rules, array syntax avoids string parsing overhead.

---

## Production Considerations

### ValidationException in API vs Web Contexts

Laravel's `Handler::render()` checks `$request->expectsJson()` to decide between redirect (web) and JSON response (API). FormRequests respect this automatically — no configuration needed for dual-format support.

### Error Bag Defaults

The `$errorBag` property defaults to `'default'`. Multi-form pages should use named error bags to prevent form errors from bleeding between forms on the same page.

### Redirect Target Customization

Set `$redirect`, `$redirectRoute`, or `$redirectAction` to override the default `previous()` redirect. This is essential for multi-step forms where validation failure should return to a specific step.

---

## Common Mistakes

### Side Effects in rules()

`rules()` is called via the container — it CAN have side effects (database queries, service calls). This is almost always wrong. Rules should be deterministic, not dependent on mutable state. Use `withValidator()` for conditional rules that depend on external state.

### Returning $request->all()

Using `$request->all()` in the controller when a FormRequest was type-hinted defeats the purpose. The controller should use `$request->validated()` or `$request->safe()` to guarantee only validated data is consumed.

### Authorization Gate Logic in rules()

`authorize()` runs BEFORE `rules()`. Placing authorization logic inside `rules()` means it runs AFTER authorization — a leaking of concerns. Authorization belongs in `authorize()`, validation in `rules()`.

---

## Failure Modes

### Authorization Exception Masking Validation Errors

If `authorize()` fails, the user sees a 403 before any validation errors are collected. This is correct behavior — auth failures should preempt validation — but developers new to the pipeline expect to see all errors at once.

### Null Container

If a FormRequest is instantiated outside the container (e.g., via `new StoreUserRequest()`), `$this->container` is null, and calls to `$this->container->call()` will fail. FormRequests must be resolved through Laravel's container.

---

## Ecosystem Usage

### Laravel Nova
Nova uses FormRequests internally for resource creation and updates. Nova's `Lens` and `Action` classes also follow the `rules()`/`authorize()` pattern.

### Laravel Jetstream
Jetstream uses FormRequests for team management, profile updates, and two-factor authentication — notably as `StoreTeamRequest`, `UpdateTeamNameRequest`, etc.

### Laravel Spark
Spark extends FormRequests for billing operations, often adding subscription-aware validation via constructor injection.

---

## Related Knowledge Units

- **Authorization in Requests** (this subdomain) — deep dive on `authorize()` mechanics
- **Validation Rule Patterns** (this subdomain) — string vs array syntax, `Rule::unique()`, `Rule::exists()`
- **Manual Validator Usage** (this subdomain) — `Validator::make()` in non-HTTP contexts
- **Form Request DTO Integration** (this subdomain) — bridging requests to typed data objects
- **Controller Dependency Injection** (controllers subdomain) — how resolved dependencies trigger validation
- **After Validation Hooks** (this subdomain) — withValidator, passedValidation, failedValidation

---

## Research Notes

### FormRequest vs Precognition
Laravel Precognition generates validation rules for frontend use. FormRequest supports `isPrecognitive()` checks, allowing rules to behave differently during precognitive validation (e.g., skip database-existence checks).

### Framework Source Reference
- `Illuminate\Foundation\Http\FormRequest` — base class
- `Illuminate\Validation\ValidatesWhenResolvedTrait` — validation pipeline definition
- `Illuminate\Routing\Router::resolveMethodDependencies()` — trigger site
