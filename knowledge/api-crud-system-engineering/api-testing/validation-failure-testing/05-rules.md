# Validation Failure Testing — Rules

## One Test Per Validation Rule Per Field
---
## Category
Testing
---
## Rule
Write a separate test for each validation rule applied to each field.
---
## Reason
Each rule (required, email, unique, exists, min, max) is a distinct constraint with a different failure mode. A single test asserting "validation fails" does not reveal which rule caught the error. Per-rule tests provide targeted regression detection when a specific rule is removed or modified.
---
## Bad Example
```php
it('rejects invalid input', function () {
    $this->postJson('/api/posts', ['title' => '', 'email' => 'not-email'])->assertStatus(422);
    // Does not distinguish between required rule failure and email rule failure
});
```
---
## Good Example
```php
it('requires title', fn () => $this->postJson('/api/posts', ['title' => ''])->assertJsonValidationErrors(['title']));
it('requires valid email', fn () => $this->postJson('/api/posts', ['email' => 'invalid'])->assertJsonValidationErrors(['email']));
it('enforces title max length', fn () => $this->postJson('/api/posts', ['title' => str_repeat('a', 256)])->assertJsonValidationErrors(['title']));
```
---
## Exceptions
Trivial rules (e.g., `string` type on every field) may be covered as part of a dataset without individual test methods.
---
## Consequences Of Violation
Removing or relaxing a rule goes undetected by tests; invalid data passes validation in production.
---

## Set Valid Defaults For Non-Target Fields
---
## Category
Testing
---
## Rule
When testing a specific field's validation rule, always provide valid defaults for all other fields.
---
## Reason
A test for `title` max length may fail because `body` is also invalid (not because the max-length rule works). Providing valid defaults isolates the test to the field under scrutiny.
---
## Bad Example
```php
it('requires title', function () {
    $this->postJson('/api/posts', ['title' => '']) // body is missing — test may fail for wrong reason
        ->assertJsonValidationErrors(['title']);
});
```
---
## Good Example
```php
it('requires title', function () {
    $this->postJson('/api/posts', [
        'title' => '',
        'body' => 'Valid body content',
        'email' => 'test@example.com',
    ])->assertJsonValidationErrors(['title'])
      ->assertJsonMissingValidationErrors(['body', 'email']);
});
```
---
## Exceptions
When testing that a field is required, an entirely empty request body is acceptable as long as other required fields are documented.
---
## Consequences Of Violation
False-positive validation tests; a rule is considered working when it's actually a different field triggering the error.
---

## Use PestPHP Datasets For Rule Variations
---
## Category
Performance
---
## Rule
Use PestPHP `with()` datasets to batch multiple validation rule tests into a single test method.
---
## Reason
Each test method boots the framework kernel. Running 20 validation tests as individual methods creates 20 kernel boots. A single test method with a dataset reduces this to one kernel boot while maintaining independent assertion reporting.
---
## Bad Example
```php
it('rejects empty title', fn () => ...->assertJsonValidationErrors(['title']));
it('rejects empty body', fn () => ...->assertJsonValidationErrors(['body']));
it('rejects invalid email', fn () => ...->assertJsonValidationErrors(['email']));
// Each method boots the kernel independently
```
---
## Good Example
```php
$invalidInputs = [
    'empty title' => [['title' => '', 'body' => 'x', 'email' => 'a@b.com'], 'title'],
    'empty body'  => [['title' => 'x', 'body' => '', 'email' => 'a@b.com'], 'body'],
    'invalid email' => [['title' => 'x', 'body' => 'x', 'email' => 'bad'], 'email'],
];

it('rejects :field on store', function (array $data, string $field) {
    $this->postJson('/api/posts', $data)->assertJsonValidationErrors([$field]);
})->with($invalidInputs);
```
---
## Exceptions
When rule variations require significantly different setup logic (e.g., unique rule requires a pre-existing record).
---
## Consequences Of Violation
Slow validation test suites; reluctance to add thorough validation coverage due to performance cost.
---

## Test Both Store And Update Form Requests
---
## Category
Testing
---
## Rule
Write validation failure tests for both POST (store) and PUT/PATCH (update) form requests.
---
## Reason
Store and update requests often have different rule sets — `required` on store but `sometimes` on update, unique-with-ignore on update. Testing only one misses validation gaps in the other.
---
## Bad Example
```php
it('requires title', fn () => $this->postJson('/api/posts', ['title' => ''])->assertJsonValidationErrors(['title']));
// Update endpoint may not require title — but this is never tested
```
---
## Good Example
```php
it('requires title on store', fn () => $this->postJson('/api/posts', ['title' => ''])->assertJsonValidationErrors(['title']));
it('allows missing title on update', fn () => $this->putJson('/api/posts/1', ['body' => 'x'])->assertOk());
```
---
## Exceptions
When both store and update use the exact same form request class, one test coverage may suffice.
---
## Consequences Of Violation
Update endpoint rejects valid partial updates; clients forced to send unchanged fields.
---

## Test Middleware Transformations
---
## Category
Testing
---
## Rule
Always test with input values that trigger middleware transformations (TrimStrings, ConvertEmptyStringsToNull).
---
## Reason
Laravel's `TrimStrings` and `ConvertEmptyStringsToNull` middleware run before validation. An empty string `""` becomes `null`, which may pass validation on nullable fields when the test expected a required failure. Tests that ignore middleware transformations produce false positives.
---
## Bad Example
```php
it('rejects empty title', function () {
    $this->postJson('/api/posts', ['title' => '']) // ConvertEmptyStringsToNull converts "" to null
        ->assertJsonValidationErrors(['title']);
    // May pass even without required rule — "" becomes null, null may fail because DB column is NOT NULL
});
```
---
## Good Example
```php
it('rejects null title', function () {
    $this->postJson('/api/posts', ['title' => null])
        ->assertJsonValidationErrors(['title']);
});

it('rejects empty string title after trimming', function () {
    $this->postJson('/api/posts', ['title' => '   '])
        ->assertJsonValidationErrors(['title']);
});
```
---
## Exceptions
When middleware has been explicitly removed for the test environment or endpoint.
---
## Consequences Of Violation
False-positive validation tests; middleware configuration changes break validation silently; production validation gaps.
---
