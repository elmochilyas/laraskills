# Conditional Validation — Anti-Patterns

## Anti-Pattern 1: Deeply Nested Conditional Rule Chains

**Symptom:** Chaining multiple `required_if`, `prohibited_if`, and `exclude_if` rules on a single field, creating combinatorial complexity.

**Problem:** Deeply nested conditions become unreadable, untestable, and impossible to debug. The interaction between multiple conditions creates behavior that is impossible to reason about — the result depends on rule definition order, not business logic.

```php
// BAD — impossible to reason about
'field_x' => 'required_if:type,A|required_if:subtype,B|prohibited_if:status,archived|exclude_if:draft,true|string|max:255'
```

**Solution:** Extract distinct scenarios into separate FormRequests. Use a base class for shared rules.

```php
// GOOD — separate requests per scenario
class DraftPostRequest extends FormRequest
{
    public function rules(): array
    {
        return ['field_x' => ['nullable', 'string', 'max:255']];
    }
}

class PublishedPostRequest extends FormRequest
{
    public function rules(): array
    {
        return ['field_x' => ['required', 'string', 'max:255']];
    }
}
```

**Detection:** Search for fields with 3+ conditional rules (`required_if` + `prohibited_if` + `exclude_if` combinations).

---

## Anti-Pattern 2: Using sometimes() When required_if Would Work

**Symptom:** Employing `$validator->sometimes()` with a callback for simple conditions that `required_if` could express in a single string.

**Problem:** `sometimes()` adds unnecessary callback overhead and obscures the condition. What could be a readable one-line declarative rule becomes a multi-line closure that hides the validation intent.

```php
// BAD — over-engineered
$validator->sometimes('coupon_code', 'required|string|max:50', function (Input $input) {
    return $input->has_coupon;
});
```

**Solution:** Use declarative rules for simple field-value conditions.

```php
// GOOD — declarative and clear
'coupon_code' => 'required_if:has_coupon,true|string|max:50'
```

**Detection:** Search for `sometimes(` usage. Review each for conversion to `required_if`, `prohibited_if`, or `exclude_if`.

---

## Anti-Pattern 3: ConditionalRules::when() for Database-Dependent Conditions

**Symptom:** Using `ConditionalRules::when()` where the closure queries the database, runs external API calls, or depends on validated data.

**Problem:** `ConditionalRules::passes($data)` is evaluated at rule parse time — before validation runs. The condition operates on raw input, not validated data. Database queries here execute before authorization and before validation, wasting resources on invalid requests.

```php
// BAD — DB query at parse time, before authorization
'email' => ConditionalRules::when(
    fn () => User::where('role', 'admin')->exists(), // Runs before auth!
    ['required', 'email'],
    ['nullable', 'email']
),
```

**Solution:** Use `withValidator()` with `after()` or `sometimes()` for database-dependent conditions.

```php
// GOOD — deferred to validation time
public function withValidator(Validator $validator): void
{
    $validator->after(function (Validator $validator) {
        if (User::where('role', 'admin')->exists()) {
            // conditional logic
        }
    });
}
```

**Detection:** Search for `::find`, `::where`, `::exists`, `DB::`, `Http::` inside `ConditionalRules::when()` closures.

---

## Anti-Pattern 4: Using exclude_if When prohibited_if Is Needed

**Symptom:** Using `exclude_if` to handle mutually exclusive fields when the field's presence should cause a validation error.

**Problem:** `exclude_if` silently removes the field from validated data — the submission succeeds without error. `prohibited_if` rejects the request when the field is present, which is the correct behavior for mutually exclusive or security-sensitive fields.

```php
// BAD — field silently ignored
'admin_note' => 'exclude_if:role,user|string|max:500'
// Non-admin users can send admin_note — it just disappears
```

**Solution:** Use `prohibited_if` to reject prohibited field submissions.

```php
// GOOD — field presence causes error
'admin_note' => 'prohibited_if:role,user|string|max:500'
// Non-admin users who send admin_note get a validation error
```

**Detection:** Search for `exclude_if`. Review each usage — if the field should cause an error when present, use `prohibited_if` instead.

---

## Anti-Pattern 5: Merging Create and Update Rules Into One Conditional Request

**Symptom:** A single FormRequest using `ConditionalRules::when()` or `isMethod()` checks to handle both create and update scenarios.

**Problem:** The rules array fills with conditional branches that obscure which rules apply to which action. Maintenance requires understanding both paths simultaneously. Authorization also differs between create and update.

```php
// BAD — merged conditional request
class UserRequest extends FormRequest
{
    public function rules(): array
    {
        return ConditionalRules::when(
            fn () => $this->isMethod('post'),
            ['name' => 'required|string', 'email' => 'required|email|unique:users', 'password' => 'required|min:8'],
            ['name' => 'sometimes|string', 'email' => 'sometimes|email|unique:users,email,' . $this->route('user')]
        );
    }
}
```

**Solution:** Create separate FormRequests per action. Use a shared base class for common rules.

```php
// GOOD — separate, focused requests
class StoreUserRequest extends FormRequest { /* ... */ }
class UpdateUserRequest extends FormRequest { /* ... */ }
```

**Detection:** Search for `isMethod(`, `getMethod()`, `ConditionalRules::when` in FormRequest `rules()` methods.

---

## Anti-Pattern 6: Conditional Rules Without Coverage for All Branches

**Symptom:** Testing only the default/positive path of a conditional rule, leaving negative branches unverified.

**Problem:** An untested conditional branch can silently allow invalid data through or reject valid submissions. When the condition changes, the untested branch may break without any test failure.

```php
// BAD — only tests one branch
public function test_coupon_required_when_has_coupon(): void
{
    $response = $this->post('/orders', ['has_coupon' => true, 'coupon_code' => 'SAVE10']);
    $response->assertSessionHasNoErrors();
    // Missing: test without coupon, test with invalid coupon
}
```

**Solution:** Test every conditional branch explicitly. Use Pest datasets for combinatorial coverage.

```php
// GOOD — tests all branches
it('validates coupon_code conditionally', function ($hasCoupon, $couponCode, $shouldPass) {
    $response = $this->post('/orders', [
        'has_coupon' => $hasCoupon,
        'coupon_code' => $couponCode,
    ]);
    $shouldPass
        ? $response->assertSessionHasNoErrors('coupon_code')
        : $response->assertSessionHasErrors('coupon_code');
})->with([
    'has coupon, valid code' => [true, 'SAVE10', true],
    'has coupon, no code' => [true, '', false],
    'no coupon, no code' => [false, '', true],
    'no coupon, has code' => [false, 'SAVE10', true],
]);
```

**Detection:** Review test files for FormRequests with conditional rules. Verify each conditional path has a corresponding test case.
