# Form Request Testing — Rules

## Test Both Pass and Fail for Every Rule
---
## Category
Testing
---
## Rule
Write two test cases for every validation rule: one with valid data that must pass, one with invalid data that must fail.
---
## Reason
Testing only the passing case gives false confidence — a rule may accept invalid data silently. Both sides of the validation boundary must be verified independently.
---
## Bad Example
```php
public function test_title_validation(): void
{
    $data = ['title' => 'Valid Title'];
    $this->assertValidationPasses(
        $data, (new StorePostRequest())->rules()
    );
    // Failing case never tested
}
```
---
## Good Example
```php
public function test_title_required(): void
{
    $rules = (new StorePostRequest())->rules();
    $this->assertValidationFails(['title' => ''], $rules);
    $this->assertValidationPasses(['title' => 'Valid'], $rules);
}
```
---
## Exceptions
Trivial rules with no custom logic may use one test per boundary, but always include at least one positive and one negative test per rule.
---
## Consequences Of Violation
Validation regressions undetected; invalid data enters the system; security constraints silently bypassed.

---

## Use Validator::make() for Fast Unit Tests
---
## Category
Testing | Performance
---
## Rule
Test validation rules via `Validator::make()` directly instead of making full HTTP requests — reserve HTTP tests for verifying error response shape and status codes.
---
## Reason
`Validator::make()` tests run in under 1ms with no HTTP overhead, no DB, and no middleware. HTTP tests are 10-100x slower and should be reserved for integration-level verification.
---
## Bad Example
```php
public function test_title_rules(): void
{
    $response = $this->postJson('/api/posts', ['title' => '']);
    $response->assertStatus(422);
    // Works but slow — 100 rules x 2 cases = 200 HTTP requests
}
```
---
## Good Example
```php
public function test_title_rules(): void
{
    $rules = (new StorePostRequest())->rules();
    $this->assertValidationFails(['title' => ''], $rules);   // Sub-ms
    $this->assertValidationPasses(['title' => 'OK'], $rules); // Sub-ms
}
```
---
## Exceptions
Rules that depend on middleware, authentication, or custom `validationData()` overrides must be tested via HTTP.
---
## Consequences Of Violation
Slow test suite that developers skip; insufficient coverage because HTTP tests are too slow; long CI feedback loops.

---

## Create a Shared ValidatesFormRequest Trait
---
## Category
Testing | Maintainability
---
## Rule
Create a reusable `ValidatesFormRequest` trait with `assertValidationPasses()` and `assertValidationFails()` helpers used across all FormRequest test classes.
---
## Reason
Without shared helpers, every test class reimplements `Validator::make()` with repetitive setup, leading to inconsistent assertion patterns and wasted developer time.
---
## Bad Example
```php
class StorePostRequestTest extends TestCase
{
    public function test_title(): void
    {
        $v = Validator::make(
            ['title' => ''],
            (new StorePostRequest())->rules()
        );
        $this->assertTrue($v->fails()); // Inline every time
    }
}
```
---
## Good Example
```php
class StorePostRequestTest extends TestCase
{
    use ValidatesFormRequest;

    public function test_title(): void
    {
        $this->assertValidationFails(
            ['title' => ''],
            (new StorePostRequest())->rules()
        );
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Repetitive `Validator::make()` boilerplate; inconsistent assertion patterns; developers skip writing tests due to friction.

---

## Test authorize() in a Separate Test Class
---
## Category
Testing | Security
---
## Rule
Write a dedicated test class for the `authorize()` method of each FormRequest, testing every role/permission scenario.
---
## Reason
Authorization is the security boundary of the endpoint. Testing it alongside validation rules conflates two concerns and often results in authorization being under-tested.
---
## Bad Example
```php
class StorePostRequestTest extends TestCase
{
    // Tests validation rules but no authorization scenarios
    public function test_validation(): void { ... }
}
```
---
## Good Example
```php
class StorePostRequestAuthorizationTest extends TestCase
{
    public function test_admin_can_store(): void
    {
        $user = User::factory()->admin()->create();
        $request = StorePostRequest::create('/api/posts', 'POST');
        $request->setUserResolver(fn () => $user);
        $this->assertTrue($request->authorize());
    }
}
```
---
## Exceptions
Public endpoints that return `true` unconditionally need only a single test confirming the behavior.
---
## Consequences Of Violation
Authorization regressions undetected; privilege escalation vulnerabilities reach production.

---

## Test Boundary Values for Every Constrained Field
---
## Category
Testing | Reliability
---
## Rule
Test boundary values (min, max, empty, null, special characters, Unicode) for every constrained field in the rules.
---
## Reason
Boundary values are the most common source of validation bugs — off-by-one errors, null handling issues, and unicode truncation only surface at constraint edges.
---
## Bad Example
```php
public function test_title(): void
{
    $this->assertValidationPasses(
        ['title' => 'Normal'], $this->rules()
    );
    // Misses boundary issues
}
```
---
## Good Example
```php
/** @testWith ["", null, 256, "\u{1F600}"] */
public function test_title_boundaries(string $value): void
{
    $this->assertValidationFails(
        ['title' => $value], $this->rules()
    );
}
```
---
## Exceptions
Fields with no constraints need only test null and empty.
---
## Consequences Of Violation
Emoji truncation corrupts data; off-by-one in max length allows oversized input; null inputs cause 500 errors.

---

## Map Every Rule to at Least One Test
---
## Category
Testing | Maintainability
---
## Rule
Ensure every rule defined in `rules()` has at least one corresponding test method — coverage is the contract.
---
## Reason
A rule without a test is a rule that can break silently. When a developer adds a new rule without a test, there is no safety net for that constraint.
---
## Bad Example
```php
class StorePostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'tags' => ['sometimes', 'exists:tags,id'], // No test for tag existence
        ];
    }
}
```
---
## Good Example
```php
class StorePostRequestValidationTest extends TestCase
{
    public function test_title_required(): void { ... }
    public function test_title_string(): void { ... }
    public function test_title_max_255(): void { ... }
    public function test_body_required(): void { ... }
    public function test_tags_exists(): void { ... }
}
```
---
## Exceptions
No common exceptions — every rule must be tested.
---
## Consequences Of Violation
Untested rules are accidentally removed or modified during refactoring; regressions reach production without detection.
