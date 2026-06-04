# Form Request Testing — Anti-Patterns

## Anti-Pattern 1: Testing Validation Rules via HTTP End-to-End Tests Only

**Symptom:** Every validation scenario is tested by making a full HTTP request through the entire middleware stack, controller, and database. No isolated unit tests exist for the FormRequest class.

**Problem:** E2E validation tests are slow, brittle, and expensive. Each test hits the database, processes middleware, and runs the controller — all to check a simple rule like `max:255`. A single E2E test takes 50-500ms; the same test with isolated validation takes <5ms.

```php
// BAD — slow E2E test for a simple rule
it('requires a title', function () {
    $response = $this->postJson('/api/posts', []);
    $response->assertJsonValidationErrorFor('title');
});
```

**Solution:** Unit-test validation rules in isolation using `Validator::make()` with the FormRequest's rules.

```php
// GOOD — fast, isolated test
it('requires a title', function () {
    $validator = Validator::make(
        ['title' => ''],
        (new StorePostRequest())->rules()
    );
    expect($validator->fails())->toBeTrue();
    expect($validator->errors()->has('title'))->toBeTrue();
});
```

**Detection:** Search for `assertJsonValidationError` or `assertSessionHasErrors` used exclusively for validation testing without any isolated tests.

---

## Anti-Pattern 2: Testing Without the authorize() Method

**Symptom:** Validation tests that bypass authorization by only testing the rules in isolation, without verifying that `authorize()` runs first and returns the expected result.

**Problem:** Bypassing authorization creates a false sense of security. A user with no permissions could hit the endpoint — tests should verify that the right users can access the action.

```php
// BAD — tests validation but not authorization
it('validates the title', function () {
    $validator = Validator::make(
        ['title' => ''],
        (new StorePostRequest())->rules()
    );
    expect($validator->fails())->toBeTrue();
});
```

**Solution:** Write an authorization test alongside every FormRequest's rule tests.

```php
// GOOD — tests both validation and authorization
it('authorizes the request', function () {
    $user = User::factory()->create();
    $request = new StorePostRequest([], ['POST']);
    $request->setUserResolver(fn () => $user);
    expect($request->authorize())->toBeFalse(); // Non-owner cannot
});

it('validates the title', function () {
    $validator = Validator::make(
        ['title' => ''],
        (new StorePostRequest())->rules()
    );
    expect($validator->fails())->toBeTrue();
});
```

**Detection:** Search for FormRequest test files. Verify each has at least one authorization test case.

---

## Anti-Pattern 3: Testing Only the Happy Path

**Symptom:** Validation tests that only submit valid data and verify the request passes. Failure scenarios are untested.

**Problem:** Untested failure paths mean regressions in validation rules go undetected. When a `required` rule is accidentally removed, no test fails. When a `min` constraint changes, the boundary behavior is lost.

```php
// BAD — only happy path
it('creates a post with valid data', function () {
    $response = $this->post('/posts', [
        'title' => 'Valid Title',
        'body' => str_repeat('A', 100),
    ]);
    $response->assertCreated();
    // Missing: tests for missing title, short body, etc.
});
```

**Solution:** Test every validation rule's failure boundary.

```php
// GOOD — tests all boundaries
it('rejects missing title', fn () => /* ... */);
it('rejects short title', fn () => /* ... */);
it('rejects long title', fn () => /* ... */);
it('rejects missing body', fn () => /* ... */);
it('accepts valid data', fn () => /* ... */);
```

**Detection:** Search for FormRequest test files. Count the number of test cases: if tests < rules, likely only happy path is covered.

---

## Anti-Pattern 4: Testing FormRequest Methods Through the Parent Class Auth Check

**Symptom:** Tests call `$request->all()` or `$request->validated()` without mocking the user resolver or calling `$request->setContainer()`.

**Problem:** FormRequest methods depend on `auth()` and the container. Calling them without proper setup throws `RuntimeException: A request must be authenticated` or null-pointer errors.

```php
// BAD — exception during test setup
it('has rules', function () {
    $request = new StorePostRequest();
    // Calling rules() works, but testing prepareForValidation() or authorize() will throw
});
```

**Solution:** Use `$request->setUserResolver()` for authorizations and `$request->setContainer()` for container-dependent methods.

```php
// GOOD — properly initialized
it('prepares data before validation', function () {
    $user = User::factory()->create();
    $request = new StorePostRequest(
        query: [],
        request: ['title' => '  hello  '],
        attributes: ['post' => Post::factory()->create()],
        cookies: [],
        files: [],
        server: ['REQUEST_METHOD' => 'POST'],
        content: null
    );
    $request->setUserResolver(fn () => $user);
    $request->setContainer(app());
    $request->prepareForValidation();
    expect($request->input('title'))->toBe('hello');
});
```

**Detection:** Search for tests creating FormRequest instances. Check if they call `setUserResolver` or `setContainer`.

---

## Anti-Pattern 5: Testing Every Rule Individually Without Using Datasets

**Symptom:** Writing separate test methods for each validation failure scenario, resulting in massive test files with repetitive setup code.

**Problem:** Repetitive test methods with similar setup are hard to maintain. Adding a new validation rule requires adding multiple new test methods, making testing feel burdensome.

```php
// BAD — repetitive, verbose
it('rejects missing title', function () { /* setup + assert */ });
it('rejects short title', function () { /* setup + assert */ });
it('rejects long title', function () { /* setup + assert */ });
it('rejects missing body', function () { /* setup + assert */ });
```

**Solution:** Use Pest datasets or PHPUnit's `@dataProvider` to parameterize test cases.

```php
// GOOD — concise with datasets
it('rejects invalid data', function (array $data, string $field) {
    $response = $this->postJson('/api/posts', $data);
    $response->assertJsonValidationErrorFor($field);
})->with([
    'missing title' => [['body' => 'valid'], 'title'],
    'short title' => [['title' => 'ab', 'body' => 'valid'], 'title'],
    'long title' => [['title' => str_repeat('a', 256), 'body' => 'valid'], 'title'],
    'missing body' => [['title' => 'valid'], 'body'],
]);
```

**Detection:** Search for FormRequest test files with many repetitive test methods. Flag for consolidation into datasets.

---

## Anti-Pattern 6: Ignoring Input Preparation in Tests

**Symptom:** Tests validate raw input without considering `prepareForValidation()` or `failedValidation()` overrides.

**Problem:** When `prepareForValidation()` sanitizes or transforms input (trimming, slug generation, merging defaults), tests that skip this step produce false positives or negatives. The test validates raw data, but the actual request processes transformed data.

```php
// BAD — tests raw data, skips prepareForValidation
it('requires a slug', function () {
    $request = new StorePostRequest(request: ['title' => 'Hello World']);
    $validator = Validator::make($request->all(), $request->rules());
    expect($validator->fails())->toBeTrue(); // Fails because test bypassed prepareForValidation
});
```

**Solution:** Test the full lifecycle — call `prepareForValidation()` and then validate.

```php
// GOOD — tests through the full lifecycle
it('generates slug from title', function () {
    $request = new StorePostRequest(request: ['title' => 'Hello World']);
    $request->setContainer(app());
    $request->prepareForValidation();
    expect($request->input('slug'))->toBe('hello-world');
});
```

**Detection:** Search for FormRequests with `prepareForValidation()` overrides. Verify corresponding tests call the method before asserting.
