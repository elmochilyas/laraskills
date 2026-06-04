# Form Request Design for APIs — Rules

## Always Use Array Syntax for Validation Rules
---
## Category
Maintainability | Framework Usage
---
## Rule
Define validation rules as arrays — never use pipe-delimited strings.
---
## Reason
Array syntax is type-safe, IDE-compatible with autocompletion, extensible with Rule objects and closures, and supports method references. Pipe strings are error-prone, cannot reference Rule objects, and fail silently with typos.
---
## Bad Example
```php
'title' => 'required|string|max:255|unique:posts', // Brittle pipe syntax
```
---
## Good Example
```php
'title' => ['required', 'string', 'max:255', Rule::unique('posts')],
```
---
## Exceptions
No common exceptions — array syntax is always preferred.
---
## Consequences Of Violation
Missed typos in rule names; inability to use Rule objects; harder to read and extend; no IDE support.

---

## Define authorize() in Every FormRequest
---
## Category
Security
---
## Rule
Always define an explicit `authorize()` method that returns `true` or `false` in every FormRequest.
---
## Reason
The default `authorize()` returns `false` — without an explicit method, all requests are silently denied. An explicit method documents the security boundary even when the endpoint is public.
---
## Bad Example
```php
class StorePostRequest extends FormRequest
{
    public function rules(): array
    {
        return ['title' => ['required']];
    }
    // No authorize() — defaults to false, everything denied
}
```
---
## Good Example
```php
class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Post::class);
    }
}
```
---
## Exceptions
Public endpoints (registration, login) may return `true` unconditionally, but the method must still be explicit.
---
## Consequences Of Violation
All requests return 403; developers waste hours debugging "broken" endpoints; security posture is unclear.

---

## Override failedValidation() in a Base ApiRequest Class
---
## Category
Architecture | Maintainability
---
## Rule
Override `failedValidation()` once in a base `ApiRequest` class that all API FormRequests extend, ensuring consistent JSON error responses across all endpoints.
---
## Reason
Laravel's default `failedValidation()` redirects back with flash messages — a web-oriented behavior. API endpoints must return JSON error responses with consistent structure, status code, and headers.
---
## Bad Example
```php
// Override in every FormRequest — duplicated 30 times
protected function failedValidation(Validator $validator): void
{
    throw new HttpResponseException(response()->json([...], 422));
}
```
---
## Good Example
```php
// In App\Http\Requests\Api\ApiRequest — once
protected function failedValidation(Validator $validator): void
{
    throw new HttpResponseException(
        response()->json(['errors' => [...]], 422)
    );
}
```
---
## Exceptions
No common exceptions — always centralize in the base class.
---
## Consequences Of Violation
Inconsistent error responses across endpoints; some return JSON, others redirect; maintenance burden from duplicated override code.

---

## Use One FormRequest Per Action
---
## Category
Code Organization | Maintainability
---
## Rule
Create a dedicated FormRequest class per controller action (Store, Update, Index, etc.) — never reuse a single FormRequest for multiple actions via `isMethod()` conditionals.
---
## Reason
Each action has unique validation rules, authorization logic, and error messages. A shared FormRequest with `isMethod()` conditionals becomes a tangle of branch logic that is harder to test, debug, and evolve independently.
---
## Bad Example
```php
class PostRequest extends FormRequest
{
    public function rules(): array
    {
        if ($this->isMethod('POST')) {
            return ['title' => ['required']];
        }
        if ($this->isMethod('PUT')) {
            return ['title' => ['sometimes']];
        }
        return [];
    }
}
```
---
## Good Example
```php
class StorePostRequest extends FormRequest { ... }
class UpdatePostRequest extends FormRequest { ... }
```
---
## Exceptions
No common exceptions — always split.
---
## Consequences Of Violation
Fragile conditional logic; one test change affects all actions; addition of a new action requires modifying the shared class, risking regression in other actions.

---

## Inject Dependencies via Constructor, Not Facades
---
## Category
Testing | Maintainability
---
## Rule
Inject repositories, services, and configuration into FormRequest constructors — avoid using facades or `app()` helper inside methods.
---
## Reason
Constructor injection makes dependencies explicit, testable via constructor parameters, and compatible with Laravel's automatic container resolution. Facades couple the request to the global state.
---
## Bad Example
```php
public function rules(): array
{
    $maxRating = Cache::get('max_rating', 10); // Facade inside rules
    return ['rating' => ["max:{$maxRating}"]];
}
```
---
## Good Example
```php
public function __construct(
    private RatingConfig $config,
) {
    parent::__construct();
}

public function rules(): array
{
    return ['rating' => ["max:{$this->config->maxRating()}"]];
}
```
---
## Exceptions
Simple lookups via `auth()->id()` may use facades, but for testability use `$this->user()`.
---
## Consequences Of Violation
Untestable rule logic; hidden dependencies that break when environment changes; violation of dependency inversion principle.

---

## Override validationData() to Control Input Scope
---
## Category
Security | Framework Usage
---
## Rule
Override `validationData()` to scope input to only the JSON body — prevent route parameters and query strings from entering validation.
---
## Reason
By default, Laravel merges all request data (input + route params + query string) into the validation scope. Route parameters like `post` (from `/posts/{post}`) may contaminate validation rules if they match field names.
---
## Bad Example
```php
// Route: /posts/{post}
// Input: {"title": "Hello"}
// validationData() defaults include 'post' from route — possible collision
```
---
## Good Example
```php
protected function validationData(): array
{
    return $this->json()->all(); // Only JSON body
}
```
---
## Exceptions
Endpoints that intentionally validate query string parameters (index endpoints with filters) should include query data, but still exclude route parameters.
---
## Consequences Of Violation
Route parameters merging into validated data; accidental overwrite of input fields; SQL injection via route parameters.

---

## Use $stopOnFirstFailure for Write-Heavy Endpoints
---
## Category
Performance
---
## Rule
Set `$stopOnFirstFailure = true` on FormRequests for endpoints that perform slow writes or external service calls, reducing wasted validation when the first field already fails.
---
## Reason
By default, Laravel validates all rules even after the first failure. For endpoints with expensive rules (database `exists`, unique across large tables, custom API calls), stopping on the first failure saves processing time.
---
## Bad Example
```php
class StorePostRequest extends FormRequest
{
    // $stopOnFirstFailure defaults to false — validates all rules
    
    public function rules(): array
    {
        return [
            'sku' => ['required', new UniqueSkuRule(app(SkuRepository::class))],
            'email' => ['required', new CheckFraudRule(app(FraudService::class))],
        ];
    }
}
```
---
## Good Example
```php
class StorePostRequest extends FormRequest
{
    protected $stopOnFirstFailure = true;
    
    // When 'sku' fails, 'email' (with expensive fraud check) is skipped
}
```
---
## Exceptions
Endpoints where the client needs all validation errors in a single response (e.g., multi-step forms) should leave `$stopOnFirstFailure = false`.
---
## Consequences Of Violation
Expensive validation rules execute even when earlier rules already failed; wasted API calls (fraud checks) on clearly invalid requests.
