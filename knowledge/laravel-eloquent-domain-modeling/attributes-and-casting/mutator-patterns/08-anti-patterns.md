# Mutator Patterns — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Mutator Patterns |
| Focus | Anti-patterns in mutator definition and usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Side-Effect Mutator | Design | Critical |
| 2 | Business Rule Exceptions in Mutators | Design | High |
| 3 | Legacy Syntax for New Mutators | Framework Usage | Medium |
| 4 | Mutator Used for Type Coercion (Should Be Cast) | Design | Low |
| 5 | Mutator-Cast Execution Order Mismatch | Reliability | Medium |
| 6 | Validation Logic in Mutators Instead of FormRequests | Code Organization | Medium |

## Repository-Wide Cross-Cutting Patterns

- Mutators are a common place for hidden business logic — side effects and validation creep in because the mutator runs "automatically"
- The distinction between mutators (normalization) and casts (type coercion) is frequently confused, with mutators doing cast work and vice versa
- Legacy `set{Attribute}Attribute()` mutators persist alongside modern `Attribute::make()` syntax, creating inconsistent patterns

---

## 1. Side-Effect Mutator

### Category
Design

### Description
A mutator that dispatches jobs, sends emails, makes API calls, logs to external systems, or performs any I/O beyond the model's own attribute assignment. The side effect executes on every property assignment, including during mass assignment, model hydration, and test setup.

### Why It Happens
The mutator seems like the right place to "do something" when an attribute changes. The implicit trigger (property assignment) is convenient. Developers may not realize that mutators fire during hydration and other non-user-initiated contexts.

### Warning Signs
- `dispatch(` or `dispatch_if(` calls inside a mutator closure
- `Mail::send()`, `Notification::send()`, `Log::info()` in mutators
- HTTP API calls, file writes, or database operations on other models in mutators
- Duplicate email dispatches or job runs traced to attribute assignment
- Tests that must mock external services just to create a model instance

### Why Harmful
- Side effects execute during model hydration from the database (every `SELECT` that hydrates the model triggers the mutator)
- Mass assignment from `$fill()` or `$update()` triggers side effects for every attribute listed
- Factories and seeders trigger side effects during development and testing
- Side effects cannot be queued or deferred — they run synchronously on assignment
- Impossible to distinguish "user set the password" from "data import set the password" at the mutator level

### Consequences
- Duplicate email dispatches for every model hydration
- API calls during data imports causing rate limits
- Side effects in test setup slowing down the test suite
- Jobs dispatched during batch processing when they should be deferred
- Hard-to-debug side effects that only appear in certain contexts

### Preferred Alternative
```php
// Mutator normalizes only
protected function email(): Attribute
{
    return Attribute::make(set: fn (string $value) => strtolower(trim($value)));
}

// Side effects in model events or explicit actions
protected static function booted(): void
{
    static::created(function (User $user) {
        SendWelcomeEmail::dispatch($user);
    });
}
```

### Refactoring Strategy
1. Identify side effects in mutator closures (dispatch, API calls, file I/O)
2. Move side effects to model events (`created`, `updated`) for automatic triggers
3. Or move to explicit model methods for intentional triggers
4. Keep the mutator for pure normalization only
5. Update tests to verify side effects at the event/method level

### Detection Checklist
- [ ] Search for `dispatch(`, `Mail::`, `Log::`, `Http::`, `Storage::` in mutator closures
- [ ] Check for duplicate dispatches or emails in logs
- [ ] Review factory/seed definitions for side effect triggers
- [ ] Profile model hydration for unexpected I/O
- [ ] Check queued job duplication attributed to mutator dispatch

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Perform Side Effects in Mutators |
| Knowledge | `04-standardized-knowledge.md` — Anti-Patterns: Side-Effect Mutator |
| Decision Tree | `07-decision-trees.md` — Mutator vs Cast vs FormRequest |

---

## 2. Business Rule Exceptions in Mutators

### Category
Design

### Description
Throwing domain or business rule exceptions inside a mutator's set closure when a business rule is violated. This causes unexpected failures on property assignment in contexts where validation should have been handled separately.

### Why It Happens
Defensive programming: validating at the model boundary ensures invalid data never enters. The mutator seems like the last line of defense. But mutators run in many contexts where business rules don't apply or are already validated.

### Warning Signs
- `throw new \InvalidArgumentException`, `throw_if()`, `throw_unless()` in mutator closures
- Mutator that checks business rules (status transitions, uniqueness, authorization)
- Exceptions thrown during mass assignment or `fill()` from user input
- `try/catch` wrapping every attribute assignment in controllers
- Business rule logic duplicated in FormRequests and mutators

### Why Harmful
- Exceptions in mutators are triggered by any attribute assignment, including programmatic ones that should succeed
- Mass assignment from `$request->validated()` passes FormRequest validation but then fails in the mutator
- Impossible to distinguish validation errors from business rule violations at the call site
- Factory creation and data seeding fail with business rule exceptions
- Error messages from mutators are not standardized like FormRequest errors

### Consequences
- Unexpected 500 errors from business rule exceptions during valid user input
- Data seeding and factories failing with business rule violations
- Controllers needing try/catch around every model operation
- Inconsistent error handling: some rules in FormRequest, some in mutator
- Mass assignment from admin tools failing on business rules that should only apply to user input

### Preferred Alternative
```php
// Validation in FormRequest
public function rules(): array
{
    return ['status' => 'in:active,inactive'];
}

// Mutator handles normalization only
protected function status(): Attribute
{
    return Attribute::make(set: fn (string $value) => strtolower(trim($value)));
}
```

### Refactoring Strategy
1. Identify business rule exceptions in mutator closures
2. Move input validation rules to FormRequest classes
3. Move domain business rules to model methods (e.g., `transitionTo()`)
4. Replace mutator exceptions with normalization logic or remove the exception
5. Add model-level methods as a safety net for programmatic access

### Detection Checklist
- [ ] Search for `throw` in mutator closures
- [ ] Search for `throw_if(`, `throw_unless(` in Attribute::make(set:) definitions
- [ ] Try to create a model instance via factory — does it throw?
- [ ] Review FormRequest rules — are they duplicated in mutators?
- [ ] Check error logs for exceptions originating from mutators

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Throw Business Rule Exceptions in Mutators |
| Rule | `05-rules.md` — Use FormRequest Validation for Input Rules |
| Decision Tree | `07-decision-trees.md` — Mutator vs Cast vs FormRequest |

---

## 3. Legacy Syntax for New Mutators

### Category
Framework Usage

### Description
Using the legacy `set{Attribute}Attribute()` convention for new mutators instead of the modern `Attribute::make(set: ...)` API. Legacy mutators cannot return arrays for multi-attribute updates and use a deprecated pattern.

### Why It Happens
Habit: developers familiar with older Laravel versions continue the legacy pattern. Copy-pasted code from existing legacy mutators. The legacy syntax still works, so there's no immediate pressure to migrate.

### Warning Signs
- `public function setEmailAttribute($value)` method definitions in new model code
- Mix of legacy and modern mutator syntax in the same model class
- No `use Illuminate\Database\Eloquent\Casts\Attribute;` import for modern syntax
- Legacy mutator that manually assigns `$this->attributes['field'] = $value`
- Multi-attribute update attempted in legacy mutator by setting `$this->attributes` multiple times

### Why Harmful
- Legacy mutators cannot return arrays for multi-attribute updates — they must use `$this->attributes[] =` which bypasses Eloquent's dirty tracking
- Deprecated API may be removed in future Laravel versions
- Inconsistent code style: some attributes use modern syntax, others use legacy
- Legacy mutators cannot leverage `shouldCache` or other attribute features

### Consequences
- Inconsistent mutator patterns across the codebase
- Multi-attribute updates in legacy syntax bypass Eloquent's attribute handling
- Technical debt requiring migration effort later
- Missed features (array returns, caching) unavailable for legacy mutators
- New developers confused about which syntax to use

### Preferred Alternative
```php
protected function email(): Attribute
{
    return Attribute::make(set: fn (string $value) => strtolower(trim($value)));
}
```

### Refactoring Strategy
1. Identify all legacy mutator methods via `function set\w+Attribute(`
2. Convert each to `Attribute::make(set: ...)` with equivalent logic
3. Remove the legacy method
4. Enforce modern syntax in code reviews and CI checks

### Detection Checklist
- [ ] Search for `function set\w+Attribute(` in model files
- [ ] Check new PRs for legacy mutator syntax
- [ ] Verify `use Illuminate\Database\Eloquent\Casts\Attribute;` import in models
- [ ] Confirm all new mutators use `Attribute::make(set: ...)`

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Attribute::make Over Legacy Mutator Methods |
| Skill | `06-skills.md` — Step 1: Define protected method returning Attribute |
| Knowledge | `04-standardized-knowledge.md` — Use Attribute::make(set: ...) syntax |

---

## 4. Mutator Used for Type Coercion (Should Be Cast)

### Category
Design

### Description
Using a mutator to perform simple type coercion (string to boolean, string to integer, json encode) that could be handled by a built-in `$casts` declaration. The mutator duplicates cast functionality with more code.

### Why It Happens
Familiarity: developers may be more comfortable with mutator syntax than the `$casts` array. Type coercion in a mutator "works" so the cast seems unnecessary. Legacy code may predate the availability of certain cast types.

### Warning Signs
- Mutator that casts `$value` to `(bool)`, `(int)`, `(float)` or calls `json_encode()`
- Mutator doing `$value === 'true' ? true : false` or similar manual coercion
- The same transformation could be expressed as `'attribute' => 'boolean'` or `'attribute' => 'integer'`
- Both a mutator and a cast exist for the same attribute (mutator runs first, then cast)
- Mutator shorter than 3 lines performing simple type conversion

### Why Harmful
- More code than the equivalent `$casts` declaration
- Type coercion behavior is less discoverable — hidden in a method instead of declared in `$casts`
- Inconsistent: some type coercions use casts, others use mutators
- Mutator runs on every assignment even when the cast would handle it with less overhead
- Adding a cast alongside (without removing the mutator) creates execution ordering confusion

### Consequences
- More code to maintain than a simple `$casts` entry
- Type coercion scattered across mutator methods instead of centralized in `$casts`
- Inconsistent patterns: developers must check both `$casts` and mutators for type behavior
- Mutator-cast interaction bugs when both exist for the same attribute

### Preferred Alternative
```php
// Cast handles type coercion
protected $casts = [
    'is_active' => 'boolean',
    'age' => 'integer',
    'meta' => 'array',
];
```

### Refactoring Strategy
1. Identify mutators that perform only type coercion
2. Add the appropriate cast to `$casts`
3. Remove the mutator
4. Ensure no other logic depends on the mutator's presence

### Detection Checklist
- [ ] Search for `(bool)`, `(int)`, `(float)`, `json_encode`, `json_decode` in mutator closures
- [ ] Cross-reference mutators with existing `$casts` entries
- [ ] Count lines of code in mutators doing pure type coercion
- [ ] Check for mutator-cast pairs on the same attribute
- [ ] Review if a built-in cast type covers the need

### Related
| Reference | Link |
|---|---|
| Decision Tree | `07-decision-trees.md` — Mutator vs Cast vs FormRequest |
| Knowledge | `04-standardized-knowledge.md` — For simple type coercion, use casts instead |

---

## 5. Mutator-Cast Execution Order Mismatch

### Category
Reliability

### Description
Defining both a mutator and a cast for the same attribute without considering that the mutator runs before the cast. The mutator outputs a value in a format the cast cannot process, causing runtime errors or incorrect transformations.

### Why It Happens
Developers add a mutator for input normalization and a cast for output formatting without realizing the cast also processes the mutated input. The execution order (mutator → cast) means the cast receives the mutator's output, not the original assigned value.

### Warning Signs
- Both a mutator and a `$casts` entry exist for the same attribute
- Input values throw type errors after processing (mutator outputs string, cast expects int)
- The attribute's stored value differs from both the assigned value and the expected cast output
- Confusing behavior: the mutator transforms input one way, the cast transforms it another way
- No documentation explaining the interaction between the two

### Why Harmful
- The cast processes the mutator's output, which may be a different type than the original input
- A mutator that formats a string for display may output a format that the cast can't convert back
- Debugging requires understanding both the mutator and cast execution order
- Changing either the mutator or the cast silently breaks the other
- The combined transformation may produce unexpected stored values

### Consequences
- Stored values that don't match the intended format
- Runtime type errors from conflicting transformations
- Difficult debugging: the value passes through two transformations
- Silent data corruption when types are coerced unexpectedly
- Brittle code: changing the mutator breaks the cast silently

### Preferred Alternative
```php
// Either use a mutator OR a cast, not both
// If both are needed, ensure the mutator output matches cast expectations

// Mutator normalizes to numeric, cast handles decimal formatting
protected function price(): Attribute
{
    return Attribute::make(set: fn ($value) => (float) str_replace(['$', ','], '', $value));
}
protected $casts = ['price' => 'decimal:2'];
```

### Refactoring Strategy
1. Identify attributes with both a mutator and a cast
2. Determine if the combination is intentional and documented
3. If not intentional, consolidate to one mechanism (prefer cast for type coercion, mutator for normalization)
4. If both are needed, ensure the mutator output type matches the cast's expected input
5. Add explicit documentation explaining the execution order

### Detection Checklist
- [ ] Cross-reference mutator definitions with `$casts` entries for the same attribute
- [ ] Test assigning various input formats and verifying stored values
- [ ] Check for type errors or unexpected stored values
- [ ] Review if the mutator output type matches what the cast expects
- [ ] Consider if one mechanism alone would suffice

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Understand Mutator and Cast Execution Order |
| Knowledge | `04-standardized-knowledge.md` — Mutators + casts interaction |

---

## 6. Validation Logic in Mutators Instead of FormRequests

### Category
Code Organization

### Description
Putting input validation logic (range checks, format validation, enum checks) inside mutators instead of FormRequest classes. The mutator validates and normalizes, mixing two concerns and hiding validation from the request layer.

### Why It Happens
Convenience: the mutator already processes the value, so adding validation seems natural. Developers may not have a FormRequest class or may think the model should be the sole validation boundary.

### Warning Signs
- Mutator that checks `strlen($value) > 255`, `! preg_match(...)`, or `! in_array(...)`
- Mutator that throws exceptions for invalid formats
- FormRequest validation rules that are duplicated in the mutator
- Mutator that both validates AND normalizes the value
- Controllers that don't use FormRequests because "validation is in the model"

### Why Harmful
- Validation bypassed when setting attributes programmatically (controllers, actions, jobs)
- Error messages from mutators are not standardized HTTP error responses
- Validation logic is duplicated across FormRequests and mutators
- Mutators cannot provide field-level error messages to the user
- Mixes the concern of "is this valid?" with "how should this be stored?"

### Consequences
- Inconsistent validation: programmatic paths bypass FormRequest rules
- Duplicated validation logic that must be kept in sync
- Non-standard error responses when mutators reject input
- Mutators throwing exceptions that produce 500 errors instead of 422 responses
- Testing validation through model creation is slower than testing FormRequests

### Preferred Alternative
```php
// FormRequest handles validation
public function rules(): array
{
    return ['age' => 'required|integer|min:0|max:150'];
}

// Mutator handles normalization only
protected function age(): Attribute
{
    return Attribute::make(set: fn (mixed $value) => (int) $value);
}
```

### Refactoring Strategy
1. Identify validation logic in mutators (range checks, format validation, allowed values)
2. Move validation rules to FormRequest classes
3. Keep the mutator for normalization only (trim, lowercase, type cast)
4. For domain invariants that must be enforced at the model level, add model methods (separate from mutators)
5. Remove any exceptions from mutators that were used for validation

### Detection Checklist
- [ ] Search for `if (! ...)`, `preg_match`, `in_array`, `strlen`, `min(`, `max(` in mutator closures
- [ ] Cross-reference with FormRequest validation rules for duplicates
- [ ] Check error logs for exceptions originating from mutators
- [ ] Review whether model creation via factory triggers validation
- [ ] Assess if removing validation from mutators would create a security gap

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use FormRequest Validation for Input Rules |
| Decision Tree | `07-decision-trees.md` — Mutator vs Cast vs FormRequest |
| Knowledge | `04-standardized-knowledge.md` — Mutators normalize, FormRequests validate |
