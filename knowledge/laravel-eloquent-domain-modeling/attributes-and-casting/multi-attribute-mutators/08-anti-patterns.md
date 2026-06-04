# Multi-Attribute Mutators — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Multi-Attribute Mutators |
| Focus | Anti-patterns in multi-attribute mutator usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Business Logic Hidden in Multi-Attribute Mutator | Design | High |
| 2 | Side Effects via Global State Access | Reliability | Critical |
| 3 | Silent Column Skipping From Missing $fillable | Reliability | High |
| 4 | Undocumented Multi-Attribute Behavior | Maintainability | Medium |
| 5 | Expensive Operations Inside Set Closure | Performance | High |
| 6 | Side-Effect Assignment Instead of Array Return | Framework Usage | Medium |

## Repository-Wide Cross-Cutting Patterns

- Multi-attribute mutators are frequently overused as a hiding place for business logic, turning simple property assignments into operations with hidden side effects
- The `$fillable` requirement is the most common source of silent data loss — developers forget to add all returned keys to the fillable list
- Global state access (`request()`, `auth()`) inside mutators creates hard-to-find failures in console commands and queue jobs

---

## 1. Business Logic Hidden in Multi-Attribute Mutator

### Category
Design

### Description
Using a multi-attribute mutator to perform business operations beyond simple mapping — such as token invalidation, event dispatching, email notifications, or logging. The property assignment `$user->password = '...'` becomes a disguised business operation with hidden effects.

### Why It Happens
Convenience: "When the password is set, we always want to reset tokens and send an email." Putting this in the mutator ensures it always happens. The danger is that it always happens — including during mass assignment, testing, and data migrations.

### Warning Signs
- Multi-attribute mutator that dispatches events, sends emails, or invalidates related data
- Property assignment triggering operations on other models or services
- No explicit model method like `changePassword()` — all logic is in the mutator
- Tests must mock external services just to set a property
- Data seeds or factories triggering real side effects when setting attributes

### Why Harmful
- Business logic hidden behind a property assignment is invisible during code review
- Mass assignment (`fill()`, `update()`, `create()`) triggers business logic unintentionally
- Cannot skip the business logic when needed (data imports, migrations, tests)
- Mutators cannot be queued or deferred — they run synchronously
- Testing the mutator requires bootstrapping the entire application context

### Consequences
- Tests that must mock external services just to create a model instance
- Data seeding or factory creation triggering real email dispatches
- Mass assignment from user input inadvertently dispatching events
- No ability to bypass business logic for administrative operations
- Business logic scattered across mutators instead of centralized in explicit methods

### Preferred Alternative
```php
// Mutator handles mapping only
protected function password(): Attribute
{
    return Attribute::make(
        set: fn (string $value) => [
            'password' => bcrypt($value),
            'password_changed_at' => now(),
        ],
    );
}

// Business logic in explicit method
public function changePassword(string $newPassword): void
{
    $this->password = $newPassword;
    $this->tokens()->delete();
    Event::dispatch(new PasswordChanged($this));
}
```

### Refactoring Strategy
1. Identify multi-attribute mutators that perform operations beyond mapping
2. Extract business operations (events, notifications, related model changes) into explicit methods
3. Keep the mutator for mapping only (hash + timestamp)
4. Update callers to use the explicit method instead of property assignment where business logic is needed

### Detection Checklist
- [ ] Search for `Event::dispatch`, `Mail::send`, `Log::info`, `dispatch(` in mutator closures
- [ ] Search for `$this->relation()->` mutation in mutators
- [ ] Check if creating a model instance in tests triggers unwanted side effects
- [ ] Review mutator for calls to services, repositories, or actions
- [ ] Assess whether `$model->attribute = value` should have hidden consequences

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Use Multi-Attribute Mutators as Business Logic Substitutes |
| Decision Tree | `07-decision-trees.md` — Mutator vs Explicit Model Method |
| Knowledge | `04-standardized-knowledge.md` — Not a substitute for explicit methods |

---

## 2. Side Effects via Global State Access

### Category
Reliability

### Description
Calling `request()`, `auth()`, `session()`, or any global state accessor inside a multi-attribute mutator's set closure. The mutator becomes dependent on HTTP request context, failing when called from queue jobs, Artisan commands, or tests.

### Why It Happens
The current request's IP address, user agent, or session data seems like a natural part of the attribute operation (e.g., recording `last_login_ip`). The `request()` helper is convenient and always works during development.

### Warning Signs
- `request()->ip()`, `request()->userAgent()`, `request()->header()` in mutator closures
- `auth()->user()`, `auth()->id()` used to set related attributes
- `session()->getId()` or other session data in mutators
- Runtime exceptions in queue jobs or console commands: "Call to a member function ip() on null"
- Tests that fail unless bootstrapping a full HTTP request

### Why Harmful
- Every non-HTTP context (queue, console, tests) will crash when the attribute is assigned
- The mutator cannot be used in data imports, batch updates, or administrative scripts
- HTTP-context coupling prevents using the model in any non-request context
- Tests must simulate HTTP requests to set model attributes, making them slow and brittle

### Consequences
- Runtime exceptions in queue jobs, scheduled tasks, and Artisan commands
- Data imports that fail because mutators try to access request data
- Tests that require HTTP environment bootstrap even for simple model operations
- Hidden coupling: adding a `request()` call to a mutator breaks non-HTTP flows silently until runtime

### Preferred Alternative
```php
// Mutator sets only local data without global state
protected function lastLoginAt(): Attribute
{
    return Attribute::make(
        set: fn ($value) => [
            'last_login_at' => $value,
        ],
    );
}

// Global state handled in explicit method at the controller level
public function recordLogin(Request $request): void
{
    $this->last_login_at = now();
    $this->last_login_ip = $request->ip();
    $this->save();
}
```

### Refactoring Strategy
1. Identify global state access in multi-attribute mutators
2. Remove the global state call from the mutator
3. Move the global state-dependent attribute to an explicit method or controller logic
4. Update callers to use the explicit method in HTTP contexts
5. For non-HTTP contexts, provide alternative attribute setting without global state

### Detection Checklist
- [ ] Search for `request()->`, `auth()->`, `session()->` in model attribute methods
- [ ] Search for `app('request')`, `resolve('request')` in mutator closures
- [ ] Check queue job failures for "Call to a member function on null" errors
- [ ] Review console command tests for HTTP context dependencies
- [ ] Test: assign the attribute in a console command context

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Introduce Side Effects Inside Multi-Attribute Mutators |
| Skill | `06-skills.md` — Step 4: Keep closure free of side effects |
| Knowledge | `04-standardized-knowledge.md` — No side effects |

---

## 3. Silent Column Skipping From Missing $fillable

### Category
Reliability

### Description
Returning keys from a multi-attribute mutator's set closure that are not listed in the model's `$fillable` array. The mutator returns the value, but mass-assignment protection silently discards it, causing the related column to remain unchanged.

### Why It Happens
Developers add new keys to the mutator's return array but forget to update `$fillable`. The mutator appears correct in code — the key is returned — but the value is silently dropped by Eloquent's fillable protection.

### Warning Signs
- Multi-attribute mutator returning keys that are not in the model's `$fillable` array
- Columns not being updated despite the mutator returning them
- `password_changed_at` or similar columns remaining null after assignment
- Debugging shows the mutator runs but the column value doesn't change
- Inconsistent state: the primary column updates but the related column does not

### Why Harmful
- Silent data loss: no error, no warning — the column simply isn't updated
- Difficult to debug: the mutator returns the correct array, but the value is discarded downstream
- Data integrity issues: coupled columns become inconsistent (password updated but `password_changed_at` unchanged)
- The bug appears only when mass-assignment protection is active, making it environment-dependent

### Consequences
- Coupled columns drifting out of sync
- Data integrity issues requiring manual correction
- Wasted debugging time tracing why a mutator-returned value doesn't persist
- Silent failures in production until the inconsistency is noticed in reports
- Emergency fixes to add missing fillable entries

### Preferred Alternative
```php
class User extends Model
{
    protected $fillable = ['password', 'password_changed_at'];

    protected function password(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => [
                'password' => bcrypt($value),
                'password_changed_at' => now(),
            ],
        );
    }
}
```

### Refactoring Strategy
1. For each multi-attribute mutator, list all keys returned by the set closure
2. Cross-reference with the model's `$fillable` array
3. Add any missing keys to `$fillable`
4. Run a migration to backfill any columns that were missed due to this bug
5. Add a linter rule or test that verifies all mutator return keys are fillable

### Detection Checklist
- [ ] Cross-reference multi-attribute mutator return keys with `$fillable` entries
- [ ] Check columns that should be updated by mutators but remain null or stale
- [ ] Review recent changes to mutators — were `$fillable` entries added?
- [ ] Test: assign the attribute and verify all returned columns are updated
- [ ] Search for models with `$guarded = ['*']` (no fillable protection) — these are the exception

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Ensure Array Keys Correspond to Fillable Attributes |
| Skill | `06-skills.md` — Step 3: Verify all returned keys are in $fillable |
| Knowledge | `04-standardized-knowledge.md` — Keys must correspond to fillable attributes |

---

## 4. Undocumented Multi-Attribute Behavior

### Category
Maintainability

### Description
A multi-attribute mutator that updates multiple columns without any docblock or comment explaining which columns are affected. Developers debugging unexpected column changes must discover the multi-attribute behavior by reading the mutator source.

### Why It Happens
The relationship between the attribute and the columns seems obvious to the author. Documentation is seen as optional for internal code. The multi-attribute behavior is discovered when someone changes one of the coupled columns without knowing about the mutator.

### Warning Signs
- Multi-attribute mutator with no docblock or comment
- Developers discovering multiple columns changing from a single assignment during debugging
- Confusion in code review about why modifying one attribute changes another
- Coupled columns that are modified independently in some code paths but together via the mutator in others
- No explanation of which columns are affected by the mutator

### Why Harmful
- `$model->password = '...'` may also update `password_changed_at`, but developers changing only the `password` column elsewhere may miss updating `password_changed_at`
- Debugging time wasted tracing why a column changed when only a different attribute was assigned
- New developers cannot know which columns are coupled without reading every mutator
- The coupling is invisible in the schema, migration, and model metadata

### Consequences
- Developers accidentally creating inconsistent column states by updating only the primary column
- Time lost debugging "mysterious" column changes
- Inconsistent coupling: some code paths update both columns, others update only one
- Higher onboarding friction for new team members
- Coupled columns drifting out of sync

### Preferred Alternative
```php
/**
 * Multi-attribute mutator: sets 'password' (hashed) and
 * 'password_changed_at' (current timestamp) atomically.
 */
protected function password(): Attribute
{
    return Attribute::make(
        set: fn (string $value) => [
            'password' => bcrypt($value),
            'password_changed_at' => now(),
        ],
    );
}
```

### Refactoring Strategy
1. Identify all multi-attribute mutators without documentation
2. Add a docblock to each explaining which columns are updated
3. Include the coupling rationale (e.g., "password_changed_at tracks last password update")
4. Add a team convention requiring docblocks for all multi-attribute mutators
5. Consider adding a linter rule

### Detection Checklist
- [ ] Review each attribute method returning an array — does it have a docblock?
- [ ] Check if the docblock explains which columns are affected
- [ ] Assess whether the coupling is obvious from the attribute name alone
- [ ] Survey team awareness of multi-attribute mutator locations
- [ ] Count undocumented vs documented multi-attribute mutators

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Document Multi-Attribute Relationships in Code Comments |
| Skill | `06-skills.md` — Step 2: Document the multi-attribute relationship |
| Knowledge | `04-standardized-knowledge.md` — Document the relationship |

---

## 5. Expensive Operations Inside Set Closure

### Category
Performance

### Description
Performing database queries, external API calls, geocoding, or other expensive operations inside a multi-attribute mutator's set closure. The operation runs synchronously on every attribute assignment, blocking the request.

### Why It Happens
The mutator seems like a convenient place to perform related operations. "When the address changes, geocode it" — putting the geocode call in the mutator ensures it always runs. But "always" includes every assignment, even during data imports or batch updates.

### Warning Signs
- External API calls inside mutator closures (geocoding, address verification, image processing)
- Database queries to other models inside mutators
- Mutator that triggers slow operations (file writes, image manipulation, PDF generation)
- Request latency traced to attribute assignments
- Mutator whose execution time varies with external service response time

### Why Harmful
- Every property assignment blocks until the expensive operation completes
- Data imports become prohibitively slow because each record triggers expensive operations
- External API failures (timeouts, rate limits) hard-fail the entire save operation
- Operations that should be queued or deferred run synchronously in the request
- No ability to skip the operation for bulk operations or administrative fixes

### Consequences
- Slow HTTP responses from synchronous external calls in mutators
- Data imports timing out due to per-row expensive operations
- Queue jobs failing because mutators run on every assignment
- Rate limits exceeded on external APIs due to per-assignment calls
- Inability to recover from external service failures during attribute assignment

### Preferred Alternative
```php
// Mutator handles only local mapping
protected function address(): Attribute
{
    return Attribute::make(
        set: fn (string $value) => [
            'address' => $value,
            'address_normalized' => trim($value),
        ],
    );
}

// Expensive operation deferred to a queued job
public function geocodeAddress(): void
{
    GeocodeJob::dispatch($this);
}
```

### Refactoring Strategy
1. Identify expensive operations inside mutator closures
2. Replace with queued job dispatch (if operation can be deferred)
3. Or move to an explicit model method (if operation must be synchronous)
4. Keep the mutator for lightweight mapping only
5. Update callers to trigger the expensive operation explicitly

### Detection Checklist
- [ ] Search for `Http::`, `Guzzle`, `file_get_contents`, `Storage::` in mutator closures
- [ ] Search for `DB::`, `Model::query()`, relationship queries in mutators
- [ ] Profile attribute assignment latency
- [ ] Check queue job timestamps for correlation with attribute assignment
- [ ] Review data import/export scripts for performance issues from mutators

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Avoid Expensive Operations Inside Multi-Attribute Mutators |
| Skill | `06-skills.md` — Performance Considerations |
| Knowledge | `04-standardized-knowledge.md` — Avoid expensive operations |

---

## 6. Side-Effect Assignment Instead of Array Return

### Category
Framework Usage

### Description
Using `$this->attribute = value` inside a mutator's set closure to update related columns instead of returning an associative array. This bypasses Eloquent's attribute handling and can cause infinite loops or inconsistent state.

### Why It Happens
Developers naturally write `$this->attribute = value` to set model attributes. The array return contract is less intuitive. The side-effect approach "works" in simple cases but fails in edge cases.

### Warning Signs
- `$this->attribute = value` assignments inside a set closure
- Infinite loop or stack overflow when setting an attribute inside its own mutator
- Columns set via `$this->` not being persisted after save
- Conflicting values: the returned array sets one value, `$this->` sets a different value
- Mutator that sets attributes on `$this` then returns a different value

### Why Harmful
- Eloquent's dirty tracking may not capture `$this->` assignments inside closures
- `Attribute::make()` is designed to return arrays for multi-attribute updates — `$this->` assignments are unsupported
- Setting the same attribute via `$this->` inside its own mutator causes infinite recursion
- The side-effect approach is undocumented and may break in future Laravel versions
- No way to track which columns are being modified — the return array is the contract

### Consequences
- Infinite loops when assigning the same attribute inside its own mutator
- Inconsistent state: some columns updated, others ignored
- Difficulty debugging which columns a mutator actually modifies
- Silent failures: `$this->` assignments may be lost during the save cycle
- Missing columns in persisted data despite the mutator appearing to set them

### Preferred Alternative
```php
protected function password(): Attribute
{
    return Attribute::make(
        set: fn (string $value) => [
            'password' => bcrypt($value),
            'password_changed_at' => now(), // Returned in array — correct
        ],
    );
}
```

### Refactoring Strategy
1. Identify `$this->` assignments inside set closures
2. Replace each with a key in the returned associative array
3. Remove any `$this->` assignments from the closure
4. Verify all intended columns are updated after the change

### Detection Checklist
- [ ] Search for `$this->` assignments inside `Attribute::make(set:` closures
- [ ] Check for infinite loop reports related to attribute assignment
- [ ] Verify the returned array covers all columns that should be updated
- [ ] Test: assign the attribute and verify all related columns are persisted
- [ ] Review for `$this->` assignments setting the same attribute name (recursion risk)

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Return Explicit Key-Value Arrays From Multi-Attribute Set Closures |
| Decision Tree | `07-decision-trees.md` — Array Return vs Side-Effect Assignment |
| Skill | `06-skills.md` — Workflow step 1: return associative array |
