# Form Request Unit Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Form Request Unit Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
Form request unit tests validate the `rules()`, `authorize()`, `messages()`, and `prepareForValidation()` methods of custom form request classes in isolation — without hitting a controller or the HTTP kernel. Instantiate the request with test data, call `rules()` to verify the returned validation rules, call `authorize()` with different user states to test authorization logic, and verify custom error messages. Unit testing form requests provides faster feedback and more deterministic validation than feature-level validation tests, especially for complex conditional validation logic.

---

## Core Concepts
A form request (extending `Illuminate\Foundation\Http\FormRequest`) defines `rules()`, `authorize()`, `messages()`, `attributes()`, and `prepareForValidation()`. Unit tests instantiate the request with `$request = new StorePostRequest([...])`, then call these methods directly. The request's `$request->request->replace([...])` sets input data. `$request->setContainer(app())` and `$request->setRedirector(redirect())` prepare the request for validation execution. Call `$request->validator()` to get the validator instance and check if validation passes or fails. The `authorize()` method can be tested by setting the user on the request via `$request->setUserResolver(fn() => $user)`.

---

## Mental Models
Form request unit testing is **testing the rulebook in isolation** — before the referee (controller) uses the rules, you check that the rulebook says the right things for each player (input) and scenario (user role). You can assert: "when the player is under 18, rule 7 activates" without running the full game (HTTP request).

---

## Internal Mechanics
`FormRequest` extends `Request` and implements `ValidatesWhenResolved`. When `FormRequest::validator()` is called, it creates a `Validator` instance from the `rules()`, `messages()`, and `attributes()`. Calling `$request->validator()->fails()` evaluates the rules against the input data. The `authorize()` method receives the authenticated user via `$this->user()` — setting up the user resolver provides the user. `prepareForValidation()` is called before validation runs — after calling it, the request input may be modified. Unit testing bypasses Laravel's automatic `FormRequest` resolution in controllers, isolating the validation logic from the controller.

---

## Patterns
- **Test rules return value**: `$request = new StorePostRequest(); assertIsArray($request->rules())`.
- **Test dynamic rules**: Use a `@dataProvider` with different input combinations to assert different rule sets are returned.
- **Test authorize with different users**: `$request->setUserResolver(fn() => $adminUser); assertTrue($request->authorize())`.
- **Test validation persistence**: Assert `$request->validator()->passes()` with valid data, `->fails()` with invalid.
- **Test error messages**: `$request->validator()->errors()->get('title')` returns the custom error messages.
- **Test prepareForValidation**: Create request with raw input, call `prepareForValidation()`, assert `$request->input('field')` is transformed.

---

## Architectural Decisions
Unit testing form requests is a pattern that prioritizes test speed and isolation over feature-level coverage. Feature-level validation tests (sending HTTP requests) duplicate the validation logic testing but also verify that the form request is correctly wired to the route. Many teams adopt both: unit tests for rule correctness and feature tests for route-level wiring. The tradeoff is test duplication versus confidence.

---

## Tradeoffs
| Tradeoff | Form Request Unit Test | Feature Validation Test |
|---|---|---|
| Speed | <10ms | ~100-500ms |
| Isolation | Complete (no controller, no DB) | Partial (real stack) |
| Rule correctness | Verified | Verified |
| Route wiring | Not verified | Verified |
| Debugging | Direct (call methods) | Indirect (HTTP assertions) |

---

## Performance Considerations
Form request unit tests are among the fastest tests — they don't boot the kernel or hit the database. A form request with 50 rules can be tested in <5ms. Run them in the pre-CI stage to fail fast. Use PestPHP datasets to exhaustively cover all conditional rule combinations without performance impact.

---

## Production Considerations
Form request unit tests are essential for requests with complex conditional validation (different rules based on user role, resource type, or input combinations) where feature-level coverage would require dozens of HTTP round trips. Use them as the primary validation test strategy and feature-level validation tests as the secondary (integration) layer.

---

## Common Mistakes
- Not calling `$request->setContainer(app())` before calling `$request->validator()` — the validator factory is not available, causing a crash.
- Not setting up the user resolver when testing `authorize()` — `$request->user()` returns null.
- Forgetting `prepareForValidation()` is called automatically by the framework but must be called manually in unit tests.
- Testing rules exhaustively at the unit level and skipping feature-level verification — route-to-form-request wiring is untested.

---

## Failure Modes
- **Container not bound**: `$request->validator()` throws `BindingResolutionException` because the container isn't set up.
- **Redirector not bound**: Validation failure tries to redirect but the redirector isn't configured — crashes on first error.
- **User resolver not set**: `authorize()` always returns false because `$this->user()` is null — test fails incorrectly.
- **prepareForValidation not called**: Input data isn't transformed, causing rule mismatch between unit test and feature test.

---

## Ecosystem Usage
Laravel's own form request tests in the framework's source code use the instantiation pattern. Spatie's packages unit-test form requests. The `laravel-validated-dto` package generates form requests from DTOs and provides built-in unit test generation.

---

## Related Knowledge Units
### Prerequisites
- Laravel Form Requests (rules, authorize, messages, prepareForValidation)
- feature-test-structure (contrast with feature-level testing)
- PHPUnit Mocking (setting up dependencies)

### Related Topics
- validation-failure-testing (feature-level validation testing)
- layer-isolation-in-tests (isolation rationale)
- dto-unit-testing (DTOs vs form requests)

### Advanced Follow-up Topics
- Dynamic form request rule generation (rule builders)
- Form request inheritance and composition patterns
- Automating form request tests from OpenAPI specs

---

## Research Notes
### Source Analysis
`Illuminate\Foundation\Http\FormRequest` extends `Illuminate\Http\Request`. The `validator()` method creates a validator via `$this->container->make(ValidatorFactory::class)`. `validated()` returns validated data after successful validation.
### Key Insight
Form request unit tests are the only way to test `prepareForValidation()` transformations and complex conditional rule logic without the overhead of HTTP round trips.
### Version-Specific Notes
Laravel 11's FormRequest still uses the same base class. The `validator()` method signature hasn't changed since Laravel 5.5. PestPHP 2.x provides no special helpers but standard PHPUnit patterns work.
