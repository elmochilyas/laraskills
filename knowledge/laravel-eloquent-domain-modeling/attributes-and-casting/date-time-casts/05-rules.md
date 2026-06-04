## Prefer immutable_datetime Over datetime
---
## Category
Reliability
---
## Rule
Always use `immutable_datetime` instead of `datetime` for date/time model attributes. Use `immutable_date` instead of `date`.
---
## Reason
Mutable `Carbon` objects allow accidental mutation of model state. Calling `->addDay()` on a model's date attribute modifies the model's internal `$attributes` without marking the model dirty. `CarbonImmutable` returns a new instance on every modification, preventing subtle state corruption.
---
## Bad Example
```php
protected $casts = [
    'created_at' => 'datetime', // Mutable — accidental mutation possible
];
```
---
## Good Example
```php
protected $casts = [
    'created_at' => 'immutable_datetime',
    'updated_at' => 'immutable_datetime',
];
```
---
## Exceptions
When you intentionally need to mutate a date in place and track the change as dirty, use `datetime` with explicit understanding of the mutation behavior.
---
## Consequences Of Violation
Subtle date mutation bugs where model dates change unexpectedly, corrupted date state shared across references, hours of debugging time to find accidental `->addDay()` calls.

---
## Override serializeDate for Consistent API Output
---
## Category
Design
---
## Rule
Override `serializeDate()` on the base model class to define a single date format for all JSON and array serialization. Do not format dates individually in every controller or resource.
---
## Reason
Without a centralized `serializeDate()` override, each controller or API resource must format dates individually, leading to inconsistent date formats across API endpoints and duplicated formatting code.
---
## Bad Example
```php
// Controller formats dates manually — inconsistent across endpoints
public function show(User $user): array
{
    return [
        'name' => $user->name,
        'created_at' => $user->created_at->format('Y-m-d'), // One format
    ];
}
```
---
## Good Example
```php
// Base model defines consistent format
abstract class Model extends Authenticatable
{
    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d\TH:i:sP'); // ISO 8601
    }
}
```
---
## Exceptions
When a specific API endpoint requires a date format different from the application standard, use API Resources with explicit date formatting for that endpoint only.
---
## Consequences Of Violation
Inconsistent date formats across API responses, duplicated date formatting code in controllers and resources, breaking API changes when developers change formatting in one endpoint but not others.

---
## Store All Timestamps in UTC
---
## Category
Design
---
## Rule
Configure the application to store all timestamps in UTC in the database. Convert to user timezone at the presentation layer only.
---
## Reason
Storing timestamps in a single canonical timezone (UTC) eliminates ambiguity, DST-related bugs, and cross-timezone comparison errors. User timezone conversion belongs in Blade directives, API resources, or frontend code — never in the database layer.
---
## Bad Example
```php
// Storing in local timezone — breaks when user travels or DST changes
$user->last_login_at = now('America/New_York');
$user->save();
```
---
## Good Example
```php
// Stored in UTC automatically by Laravel
$user->last_login_at = now(); // Laravel uses UTC by default
$user->save();

// Display in user timezone at the presentation layer
$user->last_login_at->setTimezone($request->user()->timezone);
```
---
## Exceptions
When the application operates in a single timezone with no future plans for multi-timezone support and this is explicitly documented.
---
## Consequences Of Violation
Hard-to-debug date comparison bugs across timezone boundaries, DST-related data corruption, inability to accurately sort events across timezones, painful migration when multi-timezone support is later required.

---
## Use immutable_date for Date-Only Columns
---
## Category
Design
---
## Rule
Use `immutable_date:Y-m-d` for columns that store only a date (birthday, anniversary, start_date) without a time component. Do not use `datetime` casts for date-only columns.
---
## Reason
Date-only columns with `datetime` casts include a time component (00:00:00 default), which complicates comparisons, date arithmetic, and display. Timezone conversions on date-only values can shift the date unexpectedly.
---
## Bad Example
```php
protected $casts = [
    'birthday' => 'immutable_datetime', // Includes time component
];
```
---
## Good Example
```php
protected $casts = [
    'birthday' => 'immutable_date:Y-m-d',
];
```
---
## Exceptions
When the database column type includes time information and you need the full DateTime object for consistent API responses.
---
## Consequences Of Violation
Date values shifted by timezone conversions, unexpected time components in date-only API responses, complex date arithmetic when comparing date-only values with time components.

---
## Set $dateFormat Only When Required
---
## Category
Maintainability
---
## Rule
Do not override `$dateFormat` on the model unless the database column type requires a non-standard format. Use the default `Y-m-d H:i:s` format recognized by Laravel.
---
## Reason
Custom `$dateFormat` applies globally to all date columns on the model, overriding the default format that Carbon, query builder, and serialization expect. Non-standard formats can cause serialization issues and Carbon parsing failures.
---
## Bad Example
```php
class User extends Model
{
    protected $dateFormat = 'd/m/Y'; // Non-standard — causes serialization issues
}
```
---
## Good Example
```php
class User extends Model
{
    // Uses default 'Y-m-d H:i:s' — standard across Laravel
}
```
---
## Exceptions
When connecting to a legacy database that uses a non-standard datetime format, `$dateFormat` is necessary. Document the legacy requirement clearly.
---
## Consequences Of Violation
Broken `toArray()`/`toJson()` serialization for all date columns, Carbon parsing errors on attribute access, inconsistent behavior between models with different `$dateFormat` values.
