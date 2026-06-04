# Hidden / Visible — Rules

## Rule 1: Never Define Both `$hidden` and `$visible` on the Same Model
---
## Category
Maintainability
---
## Rule
Choose either `$hidden` (deny-list) or `$visible` (allow-list), never both. When both are set, `$visible` takes precedence and `$hidden` is silently ignored.
---
## Reason
Having both arrays creates a false sense of security — developers believe both filters apply, but `$hidden` is entirely bypassed.
---
## Bad Example
```php
class User extends Model
{
    protected $hidden = ['password'];
    protected $visible = ['id', 'name', 'email'];
    // $hidden is completely ignored
}
```
---
## Good Example
```php
class User extends Model
{
    protected $hidden = ['password', 'remember_token', 'api_token'];
}
```
---
## Exceptions
No common exceptions. Pick one strategy per model and stick to it.
---
## Consequences Of Violation
Sensitive columns exposed in serialization output; false sense of security; hard-to-debug data leaks.

---

## Rule 2: Always Add Sensitive Columns to `$hidden` on Every Model
---
## Category
Security
---
## Rule
Add `password`, `remember_token`, `api_token`, and any PII columns to `$hidden` on every model that contains them, as a baseline safety net.
---
## Reason
`$hidden` is the last line of defense against accidental data exposure in logs, queue payloads, broadcast events, and API responses.
---
## Bad Example
```php
class User extends Model
{
    // No $hidden array — password and tokens visible in every serialization
}
```
---
## Good Example
```php
class User extends Model
{
    protected $hidden = [
        'password',
        'remember_token',
        'api_token',
        'email_verified_at',
    ];
}
```
---
## Exceptions
Models that legitimately expose these fields in controlled contexts (use `makeVisible` per-instance instead).
---
## Consequences Of Violation
Credential leakage through API responses, logs, notifications, and queue jobs; compliance violations (GDPR, HIPAA, PCI).

---

## Rule 3: Always Define `$pivotHidden` on Models with `BelongsToMany` Relations
---
## Category
Security
---
## Rule
Set `$pivotHidden` on every model that has a `BelongsToMany` relationship with extra pivot columns, listing all intermediate table columns that should not be serialized.
---
## Reason
Pivot table columns (especially `created_at`, `updated_at`, and role/permission fields) leak into serialization output by default through the `pivot` key.
---
## Bad Example
```php
class Role extends Model
{
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('assigned_by', 'created_at');
    }
    // No $pivotHidden — pivot columns exposed in serialization
}
```
---
## Good Example
```php
class Role extends Model
{
    protected $pivotHidden = ['assigned_by', 'created_at', 'updated_at'];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('assigned_by');
    }
}
```
---
## Exceptions
Pivot tables where every column is intentionally public (rare; document the decision).
---
## Consequences Of Violation
Data leakage via the `pivot` key in serialized many-to-many relationships; exposure of auditing metadata.

---

## Rule 4: Use `makeHidden`/`makeVisible` on Cloned or Fresh Instances Only
---
## Category
Reliability
---
## Rule
When applying runtime visibility changes with `makeHidden()` or `makeVisible()`, operate on a cloned or freshly retrieved model instance, never on a shared reference.
---
## Reason
`makeHidden`/`makeVisible` mutate the model instance. If the same instance is used elsewhere (queue, event, chained method call), the visibility changes leak into unrelated contexts.
---
## Bad Example
```php
class UserController
{
    public function show(int $id)
    {
        $user = User::findOrFail($id);
        $user->makeVisible('api_token'); // Mutates the instance
        return response()->json($user);
        // $user now has api_token visible for any downstream use
    }
}
```
---
## Good Example
```php
class UserController
{
    public function show(int $id)
    {
        $user = User::findOrFail($id);
        return response()->json(
            $user->replicate()->makeVisible('api_token')
        );
    }
}
```
---
## Exceptions
No common exceptions. Always protect shared model instances from mutation.
---
## Consequences Of Violation
Sensitive data unexpectedly visible in subsequent serializations; data leaks across requests in long-running processes (queues, Swoole, RoadRunner).

---

## Rule 5: Treat `$visible` as a Strict Allow-List for API Contracts
---
## Category
Architecture
---
## Rule
Use `$visible` only when you want an exclusive allow-list of model attributes that defines the API contract, not as a shortcut for hiding a few fields.
---
## Reason
`$visible` as an allow-list automatically excludes any new column added to the database — safe for security but risky for API contracts if expected fields silently disappear.
---
## Bad Example
```php
class User extends Model
{
    protected $visible = ['id', 'name', 'email', 'role'];
}
// Adding 'phone' to the users table — phone is silently absent from all API responses
```
---
## Good Example
```php
class User extends Model
{
    protected $hidden = ['password', 'remember_token'];
}
// Adding 'phone' to the users table — phone appears by default (intentional)
```
---
## Exceptions
Models with extremely broad column sets where only a few fields should ever be exposed (e.g., internal audit models).
---
## Consequences Of Violation
Silent omission of expected API fields when new columns are added; consumer integration failures discovered in production.

---

## Rule 6: Feature-Test That Hidden Fields Are Absent from Responses
---
## Category
Testing
---
## Rule
Write feature tests asserting that every column listed in `$hidden` is absent from the JSON response of every endpoint that serializes the model.
---
## Reason
Hidden fields can become visible due to `makeVisible` calls, `toArray()` overrides that bypass `$hidden`, or refactoring that removes the `$hidden` array.
---
## Bad Example
```php
// No test asserting password is absent from /api/users
```
---
## Good Example
```php
public function test_password_is_not_returned(): void
{
    $response = $this->getJson('/api/users/1');
    $response->assertJsonMissingPath('data.password');
}

public function test_remember_token_is_not_returned(): void
{
    $response = $this->getJson('/api/users/1');
    $response->assertJsonMissingPath('data.remember_token');
}
```
---
## Exceptions
No common exceptions. Every hidden field on every exposed model must be tested.
---
## Consequences Of Violation
Credential exposure reaching production; undetected by code review; compliance violations discovered during audits.

---

## Rule 7: Review `$hidden` Every Time a New Column Is Added to a Model
---
## Category
Maintainability
---
## Rule
Add reviewing the model's `$hidden` array to the migration code review checklist every time a new database column is added to a serialized model.
---
## Reason
A new column added without being added to `$hidden` is automatically visible in all serialization output, potentially leaking sensitive data before anyone notices.
---
## Bad Example
```php
// Migration adds 'ssn' column to users table
Schema::table('users', function (Blueprint $table) {
    $table->string('ssn')->nullable();
});
// $hidden not updated — ssn immediately appears in all API responses
```
---
## Good Example
```php
// Migration adds 'ssn' column
Schema::table('users', function (Blueprint $table) {
    $table->string('ssn')->nullable();
});

// Same PR updates User model
class User extends Model
{
    protected $hidden = [
        'password',
        'remember_token',
        'ssn', // Added
    ];
}
```
---
## Exceptions
Columns that are intentionally public and non-sensitive.
---
## Consequences Of Violation
Data leakage of new sensitive columns; compliance violations; emergency hotfixes to add fields to `$hidden` post-deployment.

---

## Rule 8: Never Use `$hidden` as a Substitute for Mass-Assignment Protection
---
## Category
Security
---
## Rule
Do not rely on `$hidden` to prevent mass-assignment. Use `$fillable` or `$guarded` for mass-assignment protection — `$hidden` only controls serialization visibility.
---
## Reason
`$hidden` and `$guarded`/`$fillable` serve completely different purposes. A hidden attribute can still be mass-assigned via `create()` or `update()`.
---
## Bad Example
```php
class User extends Model
{
    protected $hidden = ['is_admin'];
    // No $fillable — is_admin can be mass-assigned through request data
}

// Attacker: POST {"name": "Hacker", "is_admin": true}
User::create($request->all()); // is_admin is mass-assigned
```
---
## Good Example
```php
class User extends Model
{
    protected $fillable = ['name', 'email'];
    protected $hidden = ['is_admin'];
}

// Attacker: POST {"name": "Hacker", "is_admin": true}
User::create($request->all()); // is_admin silently ignored
```
---
## Exceptions
No common exceptions. Mass-assignment and serialization protection are separate concerns.
---
## Consequences Of Violation
Privilege escalation through mass-assignment; severe security vulnerabilities despite hidden fields.

---

## Rule 9: Extend `$hidden` from a Base Model for Consistent Baseline
---
## Category
Architecture
---
## Rule
Define a base `$hidden` array on a parent model or shared trait that all application models extend, then override per-model for specific additions.
---
## Reason
Without a baseline, every model developer must remember to hide sensitive columns. A shared base ensures columns like `password` are never accidentally exposed on any model.
---
## Bad Example
```php
// Each model independently declares $hidden
class User extends Model { protected $hidden = ['password']; }
class Admin extends Model { /* Forgot $hidden — password exposed */ }
```
---
## Good Example
```php
abstract class BaseModel extends Model
{
    protected $hidden = ['password', 'remember_token'];
}

class User extends BaseModel { }
class Admin extends BaseModel { }
```
---
## Exceptions
Models that have no sensitive columns and explicitly opt out (rare; document the decision).
---
## Consequences Of Violation
Inconsistent security posture across models; newly created models missing critical hidden field declarations.
---

## Rule 10: Audit Custom `toArray()` Overrides for Hidden Field Bypass
---
## Category
Security
---
## Rule
When overriding `toArray()` on a model, verify that the override does not manually return hidden attributes that would have been filtered by the default serialization.
---
## Reason
Custom `toArray()` overrides bypass the `$hidden`/`$visible` filtering logic entirely, potentially exposing protected data unless the developer explicitly respects the hidden list.
---
## Bad Example
```php
public function toArray(): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'password' => $this->password, // Bypasses $hidden
    ];
}
```
---
## Good Example
```php
public function toArray(): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
    ];
}
```
---
## Exceptions
Explicitly authorized contexts where `makeVisible()` is called before a trusted override (document and test).
---
## Consequences Of Violation
Complete bypass of the `$hidden` safety net; sensitive data exposed through API responses despite being listed in `$hidden`.
