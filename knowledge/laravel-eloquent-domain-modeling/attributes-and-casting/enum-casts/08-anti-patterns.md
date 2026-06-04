# Enum Casts — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Enum Casts |
| Focus | Anti-patterns in enum cast usage and configuration |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Unit Enum Used for Database Columns | Reliability | Critical |
| 2 | Unhandled Null From Invalid Enum Values | Reliability | High |
| 3 | Implicit Auto-Generated Backing Values | Maintainability | Medium |
| 4 | Direct Enum Assignment Without State Transition Validation | Design | High |
| 5 | Plain Array Cast for Enum Collections | Framework Usage | Medium |
| 6 | Manual Enum Conversion Instead of Cast | Framework Usage | Medium |

## Repository-Wide Cross-Cutting Patterns

- Unit enums (non-backed) used for database columns are the single biggest source of enum-related data corruption — a simple rename breaks all historical data
- The `null` return from invalid enum values is frequently missed, causing `TypeError` crashes in production when bad data is encountered
- Enum casts eliminate a massive amount of boilerplate string comparison code, but many codebases continue to manually convert instead of leveraging the cast

---

## 1. Unit Enum Used for Database Columns

### Category
Reliability

### Description
Using a unit (non-backed) PHP enum for a database column via `$casts`. The enum case `name` (e.g., `Active`) is stored as a string. Renaming a case to `Activated` breaks all existing stored data because the old name no longer matches any case.

### Why It Happens
Unit enums are simpler to define — no backing type, no values. Developers don't anticipate case renames. The danger only becomes apparent after the first enum rename in production.

### Warning Signs
- `enum Status { case Active; case Inactive; }` (no backing type) used in `$casts`
- Enum cases being renamed or refactored in pull requests
- Database rows with enum `name` strings that don't match current case names
- Data corruption after someone renames an enum case "because it's just a rename"
- Stored values in the database are PascalCase PHP identifiers

### Why Harmful
- Renaming a unit enum case (e.g., `Pending` → `PendingReview`) changes the stored database value for all subsequent writes
- Existing database rows with the old case name become "invalid enum values" that return `null`
- The data migration required to fix enum renames is costly and error-prone
- A seemingly safe refactoring (renaming a case) becomes a production incident

### Consequences
- Permanent data corruption: old rows have values that don't match any current enum case
- Null returns from enum casts on all historical data using the old case name
- Expensive data migrations required for every enum rename
- Developers afraid to rename enum cases, leaving awkward names in the codebase

### Preferred Alternative
```php
// Backed enum with explicit backing value
enum Status: string
{
    case Active = 'active';
    case Inactive = 'inactive';
}
```

### Refactoring Strategy
1. Identify all unit enums used in model `$casts`
2. Add a backing type and explicit values to each enum
3. Create a migration to convert stored name values to backing values
4. Update all comparisons and references to use enum instances
5. Delete any code that relied on the `->name` property for database values

### Detection Checklist
- [ ] Search for `enum \w+ { case` (without `: string` or `: int`)
- [ ] Cross-reference unit enums with model `$casts` entries
- [ ] Check database for stored PascalCase values that match enum case names
- [ ] Verify enum `->name` is not used for database operations
- [ ] Audit recent renames of enum cases

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Always Use Backed Enums for Database Storage |
| Decision Tree | `07-decision-trees.md` — Backed Enum vs Unit Enum |
| Skill | `06-skills.md` — Step 1: Define backed enum with explicit values |

---

## 2. Unhandled Null From Invalid Enum Values

### Category
Reliability

### Description
Code that assumes an enum-cast attribute is always a non-null enum instance, ignoring the possibility that the database contains an invalid value. When `from()` throws `\ValueError`, Laravel returns `null`, causing `TypeError` on subsequent comparisons or method calls.

### Why It Happens
Developers test with valid data and the cast always returns an enum instance. The null case only surfaces when invalid data enters the database (migration error, manual SQL, legacy data). Production crashes are the first signal.

### Warning Signs
- Direct comparisons like `$model->status === StatusEnum::Active` without null check before
- No null or nullsafe operator (`?->`) when accessing the cast attribute
- `TypeError: Cannot compare null to enum` in exception logs
- Crash when loading models with legacy or corrupted data
- No defensive coding around enum-cast attribute usage

### Why Harmful
- Production 500 errors whenever invalid database values are encountered
- Even a single invalid row crashes the entire page or API endpoint when iterating collections
- Batch processing fails on the first invalid value, leaving partial work
- Manual SQL operations or data imports that don't validate enum values cause silent crashes later
- Debugging is confusing — the error appears far from the root cause (invalid DB value)

### Consequences
- Application crashes on pages with invalid enum data
- Batch jobs failing midway through processing
- 500 errors reported by users that cannot be reproduced in development
- Emergency hotfixes to add null checks across the codebase after production incidents
- Data imports or migrations blocked by unhandled nulls

### Preferred Alternative
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

### Refactoring Strategy
1. Identify all code that uses enum-cast attributes in comparisons or method calls
2. Add null checks or nullsafe operators before enum comparisons
3. For critical paths, throw meaningful exceptions when null is encountered
4. Add a database migration to fix any existing invalid enum values
5. Add database-level CHECK constraints if possible

### Detection Checklist
- [ ] Search for `$model->status ===` or `$model->enum_attr->` comparisons without null checks
- [ ] Search for nullsafe operator `?->` usage on enum-cast attributes
- [ ] Check exception logs for "Cannot compare null" type errors
- [ ] Review batch processing code for unhandled null enum values
- [ ] Examine the database for values that don't match any enum case

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Handle Null From Invalid Database Values |
| Decision Tree | `07-decision-trees.md` — Enum Value Safety (Valid vs Invalid) |
| Skill | `06-skills.md` — Step 5: Handle null from invalid values |

---

## 3. Implicit Auto-Generated Backing Values

### Category
Maintainability

### Description
Using backed enums without explicit backing values, relying on PHP's auto-generated integer values (0, 1, 2, ...). Reordering enum cases changes the auto-generated values, corrupting stored data.

### Why It Happens
Integer-backed enums with implied values seem cleaner: `case Draft = 0; case Published = 1;` is more typing than `case Draft; case Published;`. Developers may not realize auto-generated values depend on case order.

### Warning Signs
- `enum Status: int` with `case Draft; case Published;` — no explicit values
- Enum cases reordered in a pull request "for readability"
- Stored integer values that don't match expected enum cases after a reorder
- `0` and `1` stored in a column but the mapping is unclear from reading the enum
- Data corruption after someone reorganized the enum cases alphabetically

### Why Harmful
- The stored database value for `Draft` changes from `0` to `2` if two new cases are added before it
- Any reordering of enum cases changes the mapping of all subsequent cases
- There is no explicit contract between the PHP enum and the stored value — the mapping is determined by source code order, which is invisible in the database
- Adding a new case in the middle of existing cases shifts all subsequent values

### Consequences
- Data corruption when enum case order is rearranged for any reason
- Invisible breaking change: no compile-time error, only runtime data corruption
- Painful data migration required after seemingly safe enum edits
- Developers cannot reorder or organize enum cases without breaking production data

### Preferred Alternative
```php
enum Status: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';
}
```

### Refactoring Strategy
1. Identify integer-backed enums without explicit values used in `$casts`
2. Add explicit backing values matching the currently stored data
3. Consider switching to string-backed enums for self-documenting values
4. After migration, any reordering is safe because values are explicit

### Detection Checklist
- [ ] Search for `enum \w+: int { case` without explicit `= value` assignments
- [ ] Check for enum cases reordering in git history
- [ ] Verify stored integer values match current enum case order
- [ ] Review if string-backed enums would be more appropriate
- [ ] Check for cases added in the middle of existing case lists

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Define Enum Cases With Explicit Backing Values |
| Skill | `06-skills.md` — Step 1: Explicit backing values |
| Knowledge | `04-standardized-knowledge.md` — Never rely on auto-generated values |

---

## 4. Direct Enum Assignment Without State Transition Validation

### Category
Design

### Description
Allowing direct assignment to enum-cast attributes without any validation of valid state transitions. This bypasses state machine invariants, enabling invalid transitions like `Paid → Draft` in an invoice workflow.

### Why It Happens
Enum casts make assignment trivial: `$invoice->status = StatusEnum::Paid`. When enums represent state machines, developers use direct assignment for convenience without adding transition guards.

### Warning Signs
- Enum cast used for a state machine (invoice status, order state, workflow step)
- Direct assignment `$model->status = StatusEnum::X` throughout the codebase
- No `transitionTo()` or `canTransitionTo()` methods on the model
- Invalid states in the database that violate workflow rules
- Business logic that must check "is this a valid transition?" duplicated everywhere

### Why Harmful
- Enums define valid states but not valid transitions between them
- Without transition validation, any state can transition to any other state in a single assignment
- Business invariants are not enforced: a paid invoice can be set back to draft
- State machine violations silently corrupt business data until detected in reports
- Transition logic is scattered across controllers and services instead of centralized in the model

### Consequences
- Invalid business states in the database: Paid → Draft, Delivered → Pending
- Business logic violations that corrupt workflow data
- Hard-to-detect violations: data appears valid but state transitions are logically impossible
- Duplicated transition validation logic across controllers and services
- Audit trail gaps: no centralized logging of state transitions

### Preferred Alternative
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

### Refactoring Strategy
1. Identify enum casts used as state machines (status, state, phase, step)
2. Define valid state transitions (transition matrix or allowed pairs)
3. Add `transitionTo()` and `canTransitionTo()` methods on the model
4. Replace all direct enum assignments with `transitionTo()` calls
5. Add logging or event dispatching in the transition method

### Detection Checklist
- [ ] Review enums used in `$casts` — do they represent states in a workflow?
- [ ] Search for direct assignment `$model->status =` in the codebase
- [ ] Check for duplicate transition validation logic across controllers
- [ ] Search for `canTransitionTo`, `transitionTo`, `allowedTransitions` in the codebase
- [ ] Audit database for state values that violate business rules

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Enums for State Machines With Explicit Transition Methods |
| Skill | `06-skills.md` — Decision Points: Add canTransitionTo() methods |
| Knowledge | `04-standardized-knowledge.md` — Combine with model state transition methods |

---

## 5. Plain Array Cast for Enum Collections

### Category
Framework Usage

### Description
Using the basic `array` cast instead of `AsEnumCollection` or `AsEnumArrayObject` for JSON columns containing arrays of enum backing values. The plain array stores strings with no type safety, validation, or enum instance conversion.

### Why It Happens
Developers are more familiar with the `array` cast. `AsEnumCollection` with colon-separated enum class syntax is less commonly known. The plain array "works" — values are stored correctly — but loses all type safety.

### Warning Signs
- `$casts = ['roles' => 'array']` for a JSON column storing enum backing values
- Manual `RoleEnum::from()` calls on each array element after retrieval
- Controller code that filters or validates array values against enum cases
- Runtime errors from invalid string values that aren't valid enum backing values
- Duplicate `from()` try/catch blocks across the codebase

### Why Harmful
- Every array element is a raw string — no type safety, no validation
- Invalid values enter silently and are only detected when `from()` is called
- Manual `from()` calls are scattered across controllers, services, and views
- Refactoring or removing an enum case leaves stored invalid values undetected
- The codebase must implement its own validation instead of relying on the cast

### Consequences
- Invalid enum values silently accumulating in the database
- Duplicated `from()` calls and validation logic across the codebase
- Runtime errors from invalid values that pass through without validation
- Inconsistent handling: some code validates, some doesn't
- More code to write and maintain than using the built-in enum collection cast

### Preferred Alternative
```php
protected $casts = [
    'roles' => AsEnumCollection::class . ':' . RoleEnum::class,
];
```

### Refactoring Strategy
1. Identify `array` casts on JSON columns storing enum values
2. Determine the PHP enum class for each
3. Switch to `AsEnumCollection` or `AsEnumArrayObject` with the enum class
4. Remove all manual `from()` calls and validation for those attributes
5. Run a migration to validate existing data

### Detection Checklist
- [ ] Search for `'array'` casts on columns storing enum-like values
- [ ] Search for `from(` immediately following attribute reads from JSON columns
- [ ] Look for validation logic checking array values against enum cases
- [ ] Check if the stored JSON strings match enum backing values
- [ ] Review error logs for `\ValueError` from manual enum conversion

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use AsEnumCollection for JSON Arrays of Enums |
| Knowledge | `04-standardized-knowledge.md` — AsEnumCollection for JSON arrays of enums |
| Skill | `06-skills.md` — Decision Points: JSON array of enums |

---

## 6. Manual Enum Conversion Instead of Cast

### Category
Framework Usage

### Description
Manually calling `StatusEnum::from($value)` or `StatusEnum::tryFrom($value)` when accessing a model attribute that could use an enum cast, instead of registering the cast in `$casts`. The manual conversion is repeated everywhere the attribute is read.

### Why It Happens
Legacy code written before enum casts were available. Developers may not realize that Laravel supports enum class names directly in `$casts`. The manual pattern is copied from existing code.

### Warning Signs
- `StatusEnum::from($model->status_raw)` or `$model->status_raw` with manual conversion
- Enum conversion repeated across multiple controllers, services, and Blade templates
- A separate `_raw` or uncasted column for the same data alongside manual conversion
- Missing `$casts` entry for an enum-valued column that has a corresponding PHP enum
- Inconsistent use: some code paths convert, others use raw string

### Why Harmful
- Duplicated enum conversion code across the entire codebase
- Inconsistent conversion: try/catch differences, default values, error handling vary per call site
- `from()` called redundantly — the cast would handle it once per attribute read
- Missing error handling: some callers forget try/catch and crash on invalid values
- Developers must remember to convert every time they read the attribute

### Consequences
- Duplicated `from()` calls with inconsistent error handling
- Performance overhead from manual conversion on every access
- Inconsistent behavior: some callers handle invalid values, some crash
- More code to maintain than a single `$casts` entry
- Missed conversions in some code paths — raw string compared to enum instance

### Preferred Alternative
```php
// Register the enum cast once
protected $casts = [
    'status' => InvoiceStatus::class,
];

// Use directly — no manual conversion
$invoice->status === InvoiceStatus::Paid;
```

### Refactoring Strategy
1. Identify model attributes with manual `from()` or `tryFrom()` calls
2. Register the enum cast in the model's `$casts` array
3. Remove all manual `from()` calls, replacing with direct attribute access
4. Remove any raw/uncasted duplicate columns
5. Add null handling consistent with the cast's behavior

### Detection Checklist
- [ ] Search for `Enum::from($` and `Enum::tryFrom($` on model attributes
- [ ] Cross-reference manually-converted attributes with model `$casts` entries
- [ ] Count unique conversion patterns vs the number of call sites
- [ ] Check for inconsistent try/catch or default value handling
- [ ] Verify the attribute column is not already cast (duplicate conversion)

### Related
| Reference | Link |
|---|---|
| Skill | `06-skills.md` — Step 2: Add to $casts using enum class name |
| Knowledge | `04-standardized-knowledge.md` — Enum casts eliminate manual conversions |
