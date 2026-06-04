# Rules: Mass Assignment Protection

## Define $fillable on Every Eloquent Model
---
## Category
Security
---
## Rule
Define a `$fillable` array with all columns that should be mass-assignable. Alternatively, use `$guarded` if the model has very few protected attributes.
---
## Reason
Without `$fillable` or `$guarded`, Eloquent's mass assignment protection blocks all mass assignment for new models. Defining `$fillable` documents the intended writable columns and prevents accidental mass assignment of sensitive columns like `is_admin`.
---
## Bad Example
```php
class User extends Model {
    // No $fillable — mass assignment blocked
}
```
---
## Good Example
```php
class User extends Model {
    protected $fillable = ['name', 'email', 'password'];
}
```
---
## Exceptions
Models that are never created via mass assignment — still define `$fillable` for documentation.
---
## Consequences Of Violation
MassAssignmentException on model creation.
---

## Never Add is_admin, role_id, or Similar Privilege Fields to $fillable
---
## Category
Security
---
## Rule
Exclude privilege-escalating attributes (`is_admin`, `role_id`, `permissions`) from `$fillable`. Assign them explicitly in controlled code only.
---
## Reason
Adding privilege fields to `$fillable` allows a user to send `is_admin: true` in a POST request and gain admin privileges. These fields must only be set through controlled, audited code paths (middleware, admin controllers, explicit assignment).
---
## Bad Example
```php
protected $fillable = ['name', 'email', 'password', 'is_admin']; // Users can set is_admin
```
---
## Good Example
```php
protected $fillable = ['name', 'email', 'password'];
```
```php
// Only admin controller sets is_admin explicitly
$user->is_admin = $request->input('is_admin');
$user->save();
```
---
## Exceptions
No common exceptions — privilege fields must never be mass-assignable.
---
## Consequences Of Violation
Privilege escalation, mass assignment attack.
---

## Use ->only() or ->validated() Instead of ->all() for Mass Assignment
---
## Category
Security
---
## Rule
Use `$request->validated()` (after form request validation) or `$request->only([...])` to limit input to expected fields. Avoid `$request->all()` as input to mass assignment.
---
## Reason
`$request->all()` includes every field sent by the client, including unexpected or malicious fields. `$request->validated()` returns only the validated fields. `$request->only()` returns only the named fields. Together with `$fillable`, this provides defense-in-depth against mass assignment.
---
## Bad Example
```php
// All input passed to model — relies solely on $fillable
Post::create($request->all());
```
---
## Good Example
```php
// Validated input — defense in depth with $fillable
Post::create($request->validated());
```
---
## Exceptions
No common exceptions — `->all()` should never be used for mass assignment.
---
## Consequences Of Violation
Extra fields passed to mass assignment, bypass of $fillable if misconfigured.
---

## Unset Guarded Fields Before Explicit Assignment When Needed
---
## Category
Security
---
## Rule
When explicitly assigning a guarded field, use direct property assignment (`$model->is_admin = true`) instead of `forceFill()`. Reserve `forceFill()` for admin-only, audited code paths.
---
## Reason
`forceFill()` bypasses `$fillable` protection entirely. If `forceFill()` is used with `$request->all()`, the user controls all fields. Direct property assignment makes the intent explicit and auditable.
---
## Bad Example
```php
// forceFill bypasses fillable — danger if $request has extra fields
$user->forceFill($request->all());
```
---
## Good Example
```php
// Explicit assignment — controlled and auditable
$user->is_admin = $request->boolean('is_admin');
$user->save();
```
---
## Exceptions
Admin panels with strict input validation and auditing — use `forceFill` only with validated input.
---
## Consequences Of Violation
Accidental privilege escalation, unintended field updates.
---

## Use Form Requests for Create and Update Validation
---
## Category
Architecture
---
## Rule
Create dedicated Form Request classes (e.g., `StorePostRequest`, `UpdatePostRequest`) that define validation rules and use `$request->validated()` in controllers.
---
## Reason
Form Requests encapsulate validation logic, define authorized user roles, and return only validated data. `validated()` returns only fields that passed validation rules, providing automatic filtering of unexpected fields.
---
## Bad Example
```php
// Controller with inline validation — error-prone
$validated = $request->validate([...]);
Post::create($validated);
```
---
## Good Example
```php
// Controller with Form Request
public function store(StorePostRequest $request) {
    return Post::create($request->validated());
}
```
---
## Exceptions
Simple one-field updates where Form Request overhead is not justified.
---
## Consequences Of Violation
Validation duplication across controllers, inconsistent mass assignment filtering.
---

## Never Trust Client-Side JavaScript to Prevent Mass Assignment
---
## Category
Security
---
## Rule
Verify that the frontend sends and the backend validates the same set of fields. Never rely on disabled form inputs or hidden JavaScript-side removal to prevent mass assignment.
---
## Reason
Attackers can use browser dev tools, Postman, or curl to send any fields they choose. A disabled input in the HTML does not prevent the field from being sent in the request. Server-side `$fillable` and validation are the only reliable mass assignment defenses.
---
## Bad Example
```blade
{{-- Disabled input — still sent if attacker modifies the request --}}
<input type="text" name="is_admin" value="1" disabled>
```
---
## Good Example
```php
// Server-side protection — only reliable defense
protected $fillable = ['name', 'email', 'password'];
```
---
## Exceptions
No common exceptions — server-side protection is mandatory.
---
## Consequences Of Violation
Privilege escalation through modified client requests.
