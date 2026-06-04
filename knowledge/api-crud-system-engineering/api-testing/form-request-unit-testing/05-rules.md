# Form Request Unit Testing — Rules

## Test Rules Return Value
---
## Category
Testing
---
## Rule
Assert that the `rules()` method returns an array with the correct structure for the given input state.
---
## Reason
Conditional rules (changing based on user role, HTTP method, or input values) are the primary source of validation bugs. A test that only verifies validation passes/fails does not reveal which rules were applied. Testing the `rules()` return value confirms each condition produces the correct rule set.
---
## Bad Example
```php
it('validates store request', function () {
    $request = new StorePostRequest(['title' => '']);
    $request->setContainer(app());
    $request->setRedirector(redirect());

    expect($request->validator()->fails())->toBeTrue();
    // Does not verify which rules were applied
});
```
---
## Good Example
```php
it('requires title on store', function () {
    $request = new StorePostRequest();

    expect($request->rules())->toHaveKey('title');
    expect($request->rules()['title'])->toContain('required');
});
```
---
## Exceptions
When the rules method is static and never conditional, a simple type assertion may suffice.
---
## Consequences Of Violation
Conditional rule bugs go undetected; validation allows invalid data under specific conditions.
---

## Test Dynamic Rules With Data Providers
---
## Category
Testing
---
## Rule
Use PestPHP datasets or PHPUnit `@dataProvider` to test different rule sets for different input combinations.
---
## Reason
Form requests with `required_if`, `required_with`, or role-based rules produce different rule arrays for different inputs. A single test cannot cover all combinations. Datasets enumerate each combination explicitly.
---
## Bad Example
```php
// Tests only the default path — conditional rules untested
it('validates request', function () {
    expect((new StorePostRequest())->rules())->toHaveKey('title');
});
```
---
## Good Example
```php
$ruleScenarios = [
    'draft post'   => [['status' => 'draft'], ['title', 'body'], ['published_at']],
    'published'    => [['status' => 'published'], ['title', 'body', 'published_at'], []],
];

it('applies correct rules for :scenario', function (array $input, array $expectedRules, array $notExpected) {
    $request = new StorePostRequest($input);
    $rules = $request->rules();

    foreach ($expectedRules as $field) {
        expect($rules)->toHaveKey($field);
    }
    foreach ($notExpected as $field) {
        expect($rules)->not->toHaveKey($field);
    }
})->with($ruleScenarios);
```
---
## Exceptions
When the form request has no conditional rules, a single rules assertion is sufficient.
---
## Consequences Of Violation
Conditional rule logic untested; `required_if` missing for some combinations; published posts stored without `published_at`.
---

## Test Authorize With Different User States
---
## Category
Testing
---
## Rule
Test the `authorize()` method with both permitted and forbidden user states.
---
## Reason
A form request that returns `true` from `authorize()` for unauthenticated users exposes the endpoint to unauthorized access. Testing the authorization method directly catches logic errors that feature-level tests might miss due to route middleware interception.
---
## Bad Example
```php
it('allows admin to create', function () {
    $request = new StorePostRequest();
    $request->setUserResolver(fn() => User::factory()->admin()->make());

    expect($request->authorize())->toBeTrue();
    // Does not test non-admin user
});
```
---
## Good Example
```php
it('allows admin to create', function () {
    $request = new StorePostRequest();
    $request->setUserResolver(fn() => User::factory()->admin()->make());

    expect($request->authorize())->toBeTrue();
});

it('forbids regular user from creating', function () {
    $request = new StorePostRequest();
    $request->setUserResolver(fn() => User::factory()->make());

    expect($request->authorize())->toBeFalse();
});
```
---
## Exceptions
When `authorize()` simply returns `true` (no authorization logic in the form request), a single test may suffice.
---
## Consequences Of Violation
Form request authorization logic broken; unauthorized users access endpoints through bypass scenarios.
---

## Test PrepareForValidation Transformations
---
## Category
Testing
---
## Rule
Explicitly call `prepareForValidation()` and assert that input was transformed as expected.
---
## Reason
`prepareForValidation()` runs before validation but is automatically called by the framework. In unit tests, it must be called manually. Transformations like slug generation, trimming, or data cleansing are easy to overlook — a test proves they execute correctly without hitting the HTTP kernel.
---
## Bad Example
```php
it('validates store request', function () {
    $request = new StorePostRequest(['title' => 'Hello World']);
    $request->setContainer(app());
    $request->setRedirector(redirect());

    $request->validator(); // Calls prepareForValidation internally
    // Did the slug get generated? Not explicitly tested
});
```
---
## Good Example
```php
it('generates slug from title', function () {
    $request = new StorePostRequest([], ['title' => 'Hello World']);

    $request->prepareForValidation();

    expect($request->input('slug'))->toBe('hello-world');
});
```
---
## Exceptions
Form requests without `prepareForValidation()` do not need this test.
---
## Consequences Of Violation
Input transformation logic (slug generation, data sanitization) untested; production data may be missing derived fields.
---

## Test Validation Persistence
---
## Category
Testing
---
## Rule
Assert both `->validator()->passes()` with valid data and `->validator()->fails()` with invalid data.
---
## Reason
Testing only the failure case or only the passing case gives incomplete confidence. A rule change that makes a previously passing input fail (or vice versa) goes undetected. Positive-negative pair testing validates the rule boundary exactly.
---
## Bad Example
```php
it('requires title', function () {
    $request = new StorePostRequest([], ['title' => '']);
    // ... setup
    expect($request->validator()->fails())->toBeTrue();
    // Does not test that valid data passes
});
```
---
## Good Example
```php
it('passes with valid title', function () {
    $request = new StorePostRequest([], ['title' => 'Valid Title', 'body' => 'Content']);
    $request->setContainer(app());
    $request->setRedirector(redirect());

    expect($request->validator()->passes())->toBeTrue();
});

it('fails with empty title', function () {
    $request = new StorePostRequest([], ['title' => '', 'body' => 'Content']);
    $request->setContainer(app());
    $request->setRedirector(redirect());

    expect($request->validator()->fails())->toBeTrue();
});
```
---
## Exceptions
When the form request has no custom rules (delegates entirely to validation arrays in the controller), unit tests may be skipped.
---
## Consequences Of Violation
Rule boundary incorrectly calibrated; valid data rejected or invalid data accepted without detection.
---
