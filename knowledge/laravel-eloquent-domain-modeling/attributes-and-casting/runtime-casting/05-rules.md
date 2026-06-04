## Use withCasts for Query-Level Cast Changes
---
## Category
Framework Usage
---
## Rule
Use `withCasts()` on query builder instances when you need a different cast for the results of a specific query. Do not modify the model's global cast definition for one-off query needs.
---
## Reason
`withCasts()` scopes the cast override to a single query chain, leaving the model class definition unchanged. This prevents accidental side effects on other queries using the same model.
---
## Bad Example
```php
// Modifying model casts globally for one query
User::where('is_active', true)->get()->each->mergeCasts(['metadata' => 'array']);
```
---
## Good Example
```php
// Query-level cast override — scoped to this query only
User::withCasts(['metadata' => 'array'])
    ->where('is_active', true)
    ->get();
```
---
## Exceptions
When you need to change the cast on an already-loaded model instance, use `mergeCasts()` on the instance instead.
---
## Consequences Of Violation
Model class casts definition polluted with one-off overrides, inconsistent cast behavior across different queries, accidental cast changes affecting other parts of the application.

---
## Use mergeCasts for Instance-Level Cast Changes
---
## Category
Framework Usage
---
## Rule
Use `mergeCasts()` on an existing model instance when you need to change cast behavior for that specific instance only.
---
## Reason
`mergeCasts()` scopes the override to a single object instance, allowing different instances of the same model to have different cast behavior within the same request.
---
## Bad Example
```php
$legacyUser = User::find(1);
$legacyUser->casts = array_merge($legacyUser->casts, ['metadata' => 'array']); // Bypasses internal mechanism
```
---
## Good Example
```php
$legacyUser = User::find(1);
$legacyUser->mergeCasts(['metadata' => 'array']); // Clean, documented API
```
---
## Exceptions
No common exceptions. Always use the provided `mergeCasts()` API.
---
## Consequences Of Violation
Incorrect cast behavior due to bypassing Eloquent's cast resolution mechanism, unexpected errors when accessing cast attributes, brittle code that breaks on Laravel updates.

---
## Document Runtime Cast Usage Clearly
---
## Category
Maintainability
---
## Rule
Add a code comment explaining why a runtime cast is being used, what override it applies, and how long the override is expected to remain.
---
## Reason
Runtime casts are invisible in the model definition. Without documentation, developers reading the code have no indication that the model's cast behavior has been changed. This leads to confusion and duplicated debugging effort.
---
## Bad Example
```php
$user->mergeCasts(['metadata' => 'array']);
$data = $user->metadata; // Why is metadata suddenly an array?
```
---
## Good Example
```php
// Legacy metadata column stored serialized data; newer records use properly formatted JSON.
// Override cast for this legacy record to handle the old format.
$user->mergeCasts(['metadata' => 'array']);
$data = $user->metadata;
```
---
## Exceptions
No common exceptions. Always document why a runtime cast is applied.
---
## Consequences Of Violation
Developers unaware of cast overrides, time wasted tracing why attribute behavior differs from the model definition, inconsistent debugging assumptions.

---
## Do Not Use Runtime Casting as Global Configuration Substitute
---
## Category
Design
---
## Rule
If the same cast override is needed in multiple places, update the model's `casts()` method or `$casts` property instead. Runtime casting is for one-off exceptions, not recurring patterns.
---
## Reason
Repeating runtime casts across multiple queries indicates a misconfigured model cast. The model's global cast definition should reflect the intended behavior for all uses. Runtime casts should be the exception, not the norm.
---
## Bad Example
```php
// Same override repeated in multiple controllers
class ReportController
{
    public function index(): Collection
    {
        return User::withCasts(['metadata' => 'array'])->get();
    }
}
class ExportController
{
    public function export(): Collection
    {
        return User::withCasts(['metadata' => 'array'])->get();
    }
}
```
---
## Good Example
```php
// Model defines the correct cast globally
class User extends Model
{
    protected function casts(): array
    {
        return [
            'metadata' => 'array', // Correct cast for all uses
        ];
    }
}
```
---
## Exceptions
When the override is truly one-off (handling a specific legacy record, temporary migration data), runtime casting is appropriate.
---
## Consequences Of Violation
Duplicated runtime cast calls across the codebase, inconsistent behavior if some places forget the override, maintenance burden when the override pattern changes.

---
## Keep Runtime Casting Scoped to the Specific Operation
---
## Category
Code Organization
---
## Rule
Keep runtime cast changes as close as possible to the operation that needs them. Do not apply runtime casts at the start of a request "just in case."
---
## Reason
Broad runtime casts affect all subsequent attribute accesses, potentially masking real data issues and making debugging harder. Scoping the override to the specific operation makes the intent clear and limits side effects.
---
## Bad Example
```php
// Broad, untargeted runtime cast
public function show(User $user): JsonResponse
{
    $user->mergeCasts(['metadata' => 'array']); // Applied before any specific need
    // ... many lines of code ...
    return response()->json($user); // Override may affect unrelated logic
}
```
---
## Good Example
```php
// Targeted runtime cast for the specific operation
public function exportMetadata(User $user): array
{
    $user->mergeCasts(['metadata' => 'array']);
    return $user->metadata;
}
```
---
## Exceptions
No common exceptions. Keep runtime casts scoped to the minimal necessary context.
---
## Consequences Of Violation
Unintended cast changes affecting unrelated code paths, difficult-to-trace bugs from stale cast overrides, broader-than-necessary scope of runtime modifications.
