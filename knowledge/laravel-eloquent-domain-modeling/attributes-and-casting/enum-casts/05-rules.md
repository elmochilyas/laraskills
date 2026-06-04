## Always Use Backed Enums for Database Storage
---
## Category
Reliability
---
## Rule
Use only backed enums (string or integer backing) for database columns. Never use unit enums (non-backed) for persisted attributes.
---
## Reason
Unit enums store the PHP case name as a string in the database. Renaming a case (e.g., `Active` → `Activated`) changes the stored value, corrupting existing data. Backed enums with explicit backing values maintain data integrity under refactoring.
---
## Bad Example
```php
enum Status // Unit enum — stores 'Active' as string in DB
{
    case Active;
    case Inactive;
}
```
---
## Good Example
```php
enum Status: string // Backed enum — stores 'active' regardless of case name
{
    case Active = 'active';
    case Inactive = 'inactive';
}
```
---
## Exceptions
No common exceptions. Always use backed enums for persistence.
---
## Consequences Of Violation
Database corruption when enum cases are renamed, data migration required for every enum rename, fragile coupling between PHP code and stored data.

---
## Define Enum Cases With Explicit Backing Values
---
## Category
Maintainability
---
## Rule
Always provide explicit string or integer backing values for each enum case. Do not rely on auto-generated integer backing values.
---
## Reason
Auto-generated backing values (0, 1, 2, ...) are implicit and change when case order is rearranged. Explicit values make the storage contract clear and stable regardless of code reordering.
---
## Bad Example
```php
enum Status: int
{
    case Draft = 0;    // Implicit — fragile under reordering
    case Published;    // Auto-generated value 1 — changes if cases are reordered
}
```
---
## Good Example
```php
enum Status: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';
}
```
---
## Exceptions
When using `AsEnumCollection` for JSON arrays where the case name is the serialized format and the enum is never refactored.
---
## Consequences Of Violation
Data corruption when enum case order is rearranged, mysterious bugs after seemingly safe enum edits, painful data migrations triggered by simple enum reorganization.

---
## Handle Null From Invalid Database Values
---
## Category
Reliability
---
## Rule
Always handle the possibility that enum cast attributes may return `null` from the database, and validate or transform the value before use in business logic.
---
## Reason
If the database contains a value that does not match any enum case, `from()` throws a `\ValueError`. Laravel catches this internally and returns `null`. Code that assumes the attribute is always a non-null enum instance will fail with type errors.
---
## Bad Example
```php
public function sendInvoice(): void
{
    if ($this->status === InvoiceStatus::Paid) { // TypeError if $this->status is null
        // Send receipt
    }
}
```
---
## Good Example
```php
public function sendInvoice(): void
{
    if ($this->status === null) {
        throw new \RuntimeException('Invoice has invalid status');
    }
    if ($this->status === InvoiceStatus::Paid) {
        // Send receipt
    }
}
```
---
## Exceptions
When the column is defined as `NOT NULL` in the database and validated at the application layer before persistence, null checks are less critical but still recommended for defensive coding.
---
## Consequences Of Violation
`TypeError: Cannot compare null to enum` runtime exceptions, 500 errors on pages where invalid database values exist, application crashes when bad data is encountered.

---
## Use Enums for State Machines With Explicit Transition Methods
---
## Category
Design
---
## Rule
When using enum casts for state machine patterns, add `canTransitionTo()` or `transitionTo()` methods on the model. Do not allow arbitrary enum assignment that bypasses valid state transitions.
---
## Reason
Enums define valid states, but not valid transitions. Without explicit transition validation, any state can be assigned to any other state, violating state machine invariants and allowing invalid state flows.
---
## Bad Example
```php
$invoice->status = InvoiceStatus::Paid; // Direct assignment — no transition validation
$invoice->status = InvoiceStatus::Draft; // Invalid transition: Paid → Draft
```
---
## Good Example
```php
class Invoice extends Model
{
    public function transitionTo(InvoiceStatus $newStatus): void
    {
        if (! $this->status->canTransitionTo($newStatus)) {
            throw new \InvalidArgumentException(
                "Cannot transition from {$this->status->value} to {$newStatus->value}"
            );
        }
        $this->status = $newStatus;
    }
}
```
---
## Exceptions
When the enum represents a simple categorization without transition rules (e.g., `Category`, `Type`), direct assignment is acceptable.
---
## Consequences Of Violation
Invalid entity states in the database, business logic violations (e.g., Paid → Draft), state machine invariants silently corrupted, difficult-to-debug workflow bugs.

---
## Use AsEnumCollection for JSON Arrays of Enums
---
## Category
Framework Usage
---
## Rule
Use `AsEnumCollection` or `AsEnumArrayObject` for JSON columns containing arrays of enum values. Do not store enum values as plain strings in JSON arrays with the `array` cast.
---
## Reason
Array cast stores and returns plain strings, losing type safety. `AsEnumCollection` returns a `Collection` of typed enum instances with automatic validation on read, preventing invalid values from entering the application.
---
## Bad Example
```php
protected $casts = [
    'roles' => 'array', // Returns ['admin', 'editor'] — plain strings, no type safety
];
```
---
## Good Example
```php
protected $casts = [
    'roles' => AsEnumCollection::class . ':' . RoleEnum::class,
];
```
---
## Exceptions
When the JSON array must be interoperable with non-PHP systems that require raw string values, use the `array` cast and validate at the application boundary.
---
## Consequences Of Violation
Missing type safety, manual `from()` calls scattered in code, invalid enum values silently accepted, runtime errors from unvalidated string values used as enum instances.
