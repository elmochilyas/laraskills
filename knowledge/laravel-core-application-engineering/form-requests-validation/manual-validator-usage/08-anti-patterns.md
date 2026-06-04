# Manual Validator Usage — Anti-Patterns

## Anti-Pattern 1: Calling Validator::make() in the Controller Instead of Dependency Injection

**Symptom:** Using `Validator::make()` with the Facade or `app('validator')` directly inside controller methods instead of injecting the `ValidatorFactory` via the constructor.

**Problem:** Facade calls in controllers are untestable without mocking the Facade. Constructor injection makes the dependency explicit and allows substitution in tests.

```php
// BAD — Facade in controller
public function store(Request $request)
{
    $validator = Validator::make($request->all(), ValidationFactory $factory);
    // ...
}
```

**Solution:** Inject the `ValidatorFactory` (or `ValidationFactory`) via constructor or method injection.

```php
// GOOD — explicit injection
public function __construct(
    private ValidationFactory $validator
) {}

public function store(Request $request)
{
    $validator = $this->validator->make($request->all(), [
        'email' => 'required|email',
    ]);
}
```

**Detection:** Search for `Validator::make(` in controller methods. Flag for injection.

---

## Anti-Pattern 2: Ignoring the Return Value of Validator::fails()

**Symptom:** Calling `$validator->validate()` but never checking the return value, assuming it throws on failure.

**Problem:** `validate()` does throw `ValidationException` on failure — but catching it generically or assuming it always exists leads to silent failures when the exception is swallowed.

```php
// BAD — assumes validation passes
$validator = ValidatorFactory::make($request->all(), [/* rules */]);
$validated = $validator->validated(); // Can throw ValidationException
```

**Solution:** Use `$validator->validate()` which throws on failure, or explicitly check `->fails()`.

```php
// GOOD — explicit success/failure handling
$validator = $this->validator->make($request->all(), [/* rules */]);
$validated = $validator->validate();
```

**Detection:** Search for `$validator->validated()` or `$validator->validate()` without corresponding try-catch or `fails()` check.

---

## Anti-Pattern 3: Creating New Validator Instances Inside Loops

**Symptom:** Instantiating a new `Validator` object inside a `foreach` loop for each item in a collection.

**Problem:** Each `Validator::make()` call builds a new validation engine, runs rule instantiation, and checks all rules. In a 1000-item loop, this creates 1000 validator objects, each running the same rules independently. This is a significant performance issue.

```php
// BAD — N validators for N items
foreach ($items as $item) {
    $validator = ValidatorFactory::make(
        ['value' => $item],
        ['value' => 'required|numeric|min:0|max:100']
    );
    if ($validator->fails()) { /* ... */ }
}
```

**Solution:** Use array validation rules to validate all items in a single validator call.

```php
// GOOD — single validator
$validator = $this->validator->make(
    ['values' => $items],
    ['values' => 'required|array', 'values.*' => 'required|numeric|min:0|max:100']
);
```

**Detection:** Search for `Validator::make(` or `$this->validator->make(` inside `for`, `foreach`, `while` loops.

---

## Anti-Pattern 4: Manually Constructing Validation Messages Without Using the ErrorBag

**Symptom:** Building custom error arrays from validation failures instead of using `$validator->errors()`.

**Problem:** The `MessageBag` provides structured error messages per field, supports first(), get(), all(), and formatting. Custom arrays lose this structure and are not compatible with Laravel's error rendering.

```php
// BAD — custom error array
$errors = [];
if ($validator->fails()) {
    foreach ($validator->failed() as $field => $rules) {
        $errors[$field] = implode(', ', array_keys($rules));
    }
}
return response()->json(['errors' => $errors]);
```

**Solution:** Use `$validator->errors()` and Laravel's built-in error serialization.

```php
// GOOD — use MessageBag
if ($validator->fails()) {
    return response()->json([
        'message' => 'The given data was invalid.',
        'errors' => $validator->errors(),
    ], 422);
}
```

**Detection:** Search for `$validator->failed()`, `$validator->messages()`, or custom error arrays built from validator output.

---

## Anti-Pattern 5: Calling validate() Without try-catch for Non-API Responses

**Symptom:** Using `Validator::make()->validate()` in an API context without wrapping it in a try-catch, or in a non-API context without handling the thrown `ValidationException`.

**Problem:** `validate()` throws `ValidationException`, which Laravel converts to a redirect response with flash errors. If the request expects JSON, the exception is caught by the exception handler and returns JSON. But if custom error formatting is needed, the default behavior may not match application needs.

```php
// BAD — no custom handling when needed
$validator = $this->validator->make($request->all(), ['email' => 'required|email']);
try {
    $validated = $validator->validate();
} catch (ValidationException $e) {
    // No custom handling — uses default behavior
}
```

**Solution:** Add custom error formatting when needed, or use `fails()` check for explicit control.

```php
// GOOD — explicit control
$validator = $this->validator->make($request->all(), ['email' => 'required|email']);
if ($validator->fails()) {
    return response()->json([
        'status' => 'error',
        'errors' => $validator->errors()->toArray(),
    ], 422);
}
```

**Detection:** Search for `->validate()` calls without try-catch or `fails()` checks in non-standard contexts.

---

## Anti-Pattern 6: Using Manual Validation When a FormRequest Would Suffice

**Symptom:** Creating `Validator::make()` in controllers for endpoints that validate a single entity with standard rules, where a FormRequest would be cleaner.

**Problem:** `Validator::make()` in controllers mixes validation with orchestration logic and prevents rule reuse. Every endpoint with manual validation duplicates rule definitions.

```php
// BAD — manual validation when FormRequest is appropriate
public function update(Request $request, Post $post)
{
    $validator = Validator::make($request->all(), [
        'title' => 'required|string|max:255',
        'body' => 'required|string',
    ]);
    if ($validator->fails()) {
        return redirect()->back()->withErrors($validator)->withInput();
    }
    $post->update($request->only(['title', 'body']));
}
```

**Solution:** Use FormRequests for standard CRUD validation. Reserve manual validation for dynamic rules, runtime-constructed rules, or validation that cannot be declaratively expressed.

```php
// GOOD — FormRequest handles it
public function update(UpdatePostRequest $request, Post $post)
{
    $post->update($request->validated());
}
```

**Detection:** Search for `Validator::make(` in controllers. Flag for extraction to FormRequest if it contains only standard rules.
