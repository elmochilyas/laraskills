# Controller Form Request Integration

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** Controller Form Request Integration
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Laravel form requests encapsulate validation logic and authorization checks into dedicated classes that are injected into controller methods via type-hinting. When a controller method parameter is type-hinted with a form request class, Laravel automatically validates the incoming request against the rules defined in that class before the controller method executes.

This integration keeps controllers lean by removing validation rules and authorization logic from method bodies. The `StorePhotoRequest` and `UpdatePhotoRequest` classes define what data is valid for each operation, and the controller receives pre-validated data via `$request->validated()`. Failed validation automatically returns a 422 response with error messages, never reaching the controller method.

---

## Core Concepts

- **Type-Hint Resolution**: `public function store(StorePhotoRequest $request)` — Laravel resolves and validates the form request before the method body executes.
- **rules() Method**: Returns an array of validation rules for the incoming data.
- **authorize() Method**: Returns a boolean determining if the user can perform the action.
- **Auto-422 on Failure**: If validation fails, a 422 response is returned immediately; the controller method is never called.
- **Pre-Validation Hooks**: `prepareForValidation()` and `withValidator()` customize the request before or after validation.
- **Post-Validation Hooks**: `passedValidation()` and `failedValidation()` allow side effects on success or failure.

---

## Mental Models

- **Validation Gate**: Form requests are a gate that stops invalid data before it reaches the controller. The controller operates on a "clean" data set.
- **Request Contract**: The form request is a contract: "I guarantee that data meeting these rules will reach the controller."
- **Authorization Guard**: `authorize()` is a per-action authorization check, separate from the policy layer but complementary.

---

## Internal Mechanics

When a controller method type-hints a form request, `ControllerDispatcher::dispatch()` resolves the parameter via the container. The form request extends `Illuminate\Foundation\Http\FormRequest`, which extends `Illuminate\Http\Request`.

The `FormRequest` class overrides `getValidatorInstance()` to apply the rules from `rules()`. During request lifecycle:

1. `FormRequest` is instantiated by the container.
2. `validateResolved()` is called, which builds the validator with `rules()` and `messages()`.
3. If `authorize()` returns false, a 403 `AuthorizationException` is thrown.
4. If validation fails, a 422 `ValidationException` is thrown with error messages.
5. If both pass, the validated data is available via `validated()`.

The critical timing: validation happens in `FormRequest::getValidatorInstance()` → `Container::call()` → before the controller method. This means the controller method body is never executed on invalid input.

```php
// FormRequest base class behavior
public function validated()
{
    return $this->validator->validated();
}
```

---

## Patterns

- **Standard Store/Update Pair**:
  ```php
  class StorePhotoRequest extends FormRequest
  {
      public function authorize(): bool
      {
          return $this->user()->can('create', Photo::class);
      }

      public function rules(): array
      {
          return [
              'title' => ['required', 'string', 'max:255'],
              'image' => ['required', 'image', 'max:10240'],
              'category_id' => ['required', 'exists:categories,id'],
          ];
      }
  }
  ```
  ```php
  class PhotoController extends Controller
  {
      public function store(StorePhotoRequest $request)
      {
          return new PhotoResource(Photo::create($request->validated()));
      }
  }
  ```
- **Conditional Rules**:
  ```php
  public function rules(): array
  {
      return [
          'title' => ['required', 'string', 'max:255'],
          'image' => $this->isMethod('POST')
              ? ['required', 'image', 'max:10240']
              : ['sometimes', 'image', 'max:10240'],
      ];
  }
  ```
- **After-Validation Callback**:
  ```php
  public function withValidator($validator)
  {
      $validator->after(function ($validator) {
          if ($this->user()->hasReachedUploadLimit()) {
              $validator->errors()->add('image', 'Upload limit reached.');
          }
      });
  }
  ```

---

## Architectural Decisions

- **Why form requests instead of `$request->validate()` in controllers?** Form requests isolate validation into testable, single-responsibility classes. `$request->validate()` embeds validation in the controller, making it harder to test and reuse.
- **Why separate `StoreXxxRequest` and `UpdateXxxRequest`?** Store and update typically have different rules (required vs. sometimes, unique constraints excluding the current model). Separate classes avoid conditional branching.
- **Why `authorize()` in the form request instead of the policy only?** The form request's `authorize()` is a convenience for simple checks. Complex authorization should remain in policies.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Controllers stay lean and validation-free | One additional file per CRUD action | Store+Update = 2 form request files per resource |
| Validation is tested independently | Form request tests are slower (HTTP layer) | Use unit tests with `$request->merge()` for speed |
| Automatic 422 on failure | Implicit failure path can surprise developers | Document that form request validation is pre-controller |

---

## Performance Considerations

- Form request validation overhead is proportional to rule complexity. Simple `required|string|max:255` takes ~0.1ms; complex unique-with-exclusion rules take ~1–2ms (includes database query).
- Authorization check in `authorize()` adds a policy resolution call. Cache policy results if used repeatedly.
- The `validated()` array is slightly faster than `only()` + manual validation because it reuses the already-built validator.

---

## Production Considerations

- Use `php artisan make:request StorePhotoRequest` to generate form requests.
- Return custom error messages via `messages()` method for production-facing APIs.
- Use `validated()` exclusively in controllers—never `$request->all()` or `$request->input()`, which bypass validation.
- Log validation failures in `failedValidation()` for audit trails.
- Set up form request tests: `$request->merge([...])` → `$request->setContainer($app)` → `$request->validateResolved()`.

---

## Common Mistakes

- **Using `$request->all()` in the controller instead of `$request->validated()`**: Passing unvalidated mass-assignment data to a model.
  - *Why it happens:* Habit from non-form-request controllers.
  - *Why it's harmful:* Bypasses validation; mass-assignment vulnerability.
  - *Better approach:* Always use `$request->validated()` when a form request is injected.

- **Duplicating rules across Store and Update requests**: Copy-pasting rules with minor differences.
  - *Why it happens:* No shared base form request for the resource.
  - *Why it's harmful:* Rules drift between store and update over time.
  - *Better approach:* Create a `BasePhotoRequest` with shared rules, then override `rules()` in each subclass.

- **Complex `authorize()` logic duplicating policies**: Writing 20-line authorization logic in a form request.
  - *Why it happens:* Convenience of having auth alongside validation.
  - *Why it's harmful:* Authorization logic is split between form requests and policies.
  - *Better approach:* Keep `authorize()` as a simple gate check; delegate complex logic to the policy.

---

## Failure Modes

- **Authorization failure returns 403 instead of 422**: If `authorize()` returns false, the client gets a 403, not a validation error. *Detection:* Clients report "validation failed" but get 403. *Mitigation:* Document the distinction; log authorization failures separately.

- **Form request not auto-resolved (missing type-hint)**: The controller method accepts plain `Request` instead of a form request. *Detection:* Validation logic ends up in the controller body. *Mitigation:* Code review; PHPStan rule enforcing that `store` and `update` methods type-hint form requests.

- **`rules()` returning an empty array**: A form request that fails to define rules. *Detection:* All data passes validation. *Mitigation:* Unit test each form request's `rules()` returns expected rules; add a CI check that form request rules are non-empty.

---

## Ecosystem Usage

- **Laravel Spark**: Extensive use of form requests for subscription, team, and billing validation.
- **Laravel Nova**: Nova's own form requests for resource creation and update operations.
- **Laravel Boilerplate (open-source)**: Standardizes on form requests for all API endpoints with `BaseRequest` inheritance.

---

## Related Knowledge Units

### Prerequisites
- Controller Method Injection
- Validation Basics

### Related Topics
- Controller Dependency Injection
- Controller Action Delegation

### Advanced Follow-up Topics
- Controller Testing Strategies
- Thin Controller Enforcement

---

## Research Notes

### Source Analysis
- `Illuminate\Foundation\Http\FormRequest` — base class with validation and authorization
- `Illuminate\Validation\Validator` — validation engine
- `Illuminate\Routing\ControllerDispatcher::dispatch()` — form request resolution chain

### Key Insight
Form requests are validated *before* the controller method is called. The controller never executes if validation or authorization fails. This is a security-by-design pattern, not just a code organization tool.

### Version-Specific Notes
- Form requests have existed since Laravel 5.0 with the same core API.
- `passedValidation()` and `failedValidation()` hooks added in Laravel 5.7.
- `validated()` method added in Laravel 5.8.
- No behavioral changes in Laravel 8–11.
