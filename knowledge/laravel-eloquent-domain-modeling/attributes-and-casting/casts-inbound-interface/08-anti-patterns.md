# CastsInboundAttributes Interface — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | CastsInboundAttributes Interface |
| Focus | Anti-patterns in write-only custom cast implementation |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Bidirectional Need Using Inbound Interface | Design | High |
| 2 | Adding get() to an Inbound Cast | Framework Usage | High |
| 3 | Undocumented One-Directional Behavior | Maintainability | Medium |
| 4 | Raw Value Exposed Without Read Formatting | Design | Medium |
| 5 | Incorrect set Return Structure | Reliability | High |
| 6 | Inbound Cast for Non-Normalization Logic | Design | Medium |

## Repository-Wide Cross-Cutting Patterns

- The `CastsInboundAttributes` interface is often misunderstood as "a simpler CastsAttributes" rather than a specific write-only contract, leading to bidirectional needs being forced through the wrong interface
- Teams frequently forget to document or pair inbound casts with accessors, exposing raw stored values (hashes, encoded data) directly to views and API consumers
- The empty `get` direction is a common source of confusion: developers add a `get()` method thinking it's needed, turning the inbound cast into a hybrid that violates the interface's intent

---

## 1. Bidirectional Need Using Inbound Interface

### Category
Design

### Description
Implementing `CastsInboundAttributes` when the attribute needs read-time transformation as well as write-time normalization. The stored value is not the correct PHP representation on read, forcing callers to manually transform the raw value or duplicate transformation logic everywhere.

### Why It Happens
Developers see `CastsInboundAttributes` as "simpler" and reach for it first. They may only test the write direction and overlook that reads return raw values. The pattern works in initial testing but breaks in views and API responses.

### Warning Signs
- Stored value needs formatting (string casing, concatenation, conversion) on read but inbound cast handles only write
- Callers repeatedly applying the same transformation after reading the attribute
- `CastsAttributes` would clearly be the better fit but `CastsInboundAttributes` is used instead
- Accessor exists as a workaround but the bidirectional cast would be simpler

### Why Harmful
- Read-side transformation logic is duplicated across controllers, Blade templates, API resources, and jobs
- Inconsistent transformation: one template formats differently than another because the logic is scattered
- The raw database value leaks into business logic that expects the transformed value
- Principle of encapsulation is violated — the attribute should be correct on both read and write

### Consequences
- Duplicated transformation logic across the codebase
- Inconsistent attribute behavior: some callers see the raw value, others apply transformation manually
- Higher maintenance burden: changing the transformation requires finding all manual usages
- Breaks the casting abstraction — callers must know the raw format and how to transform it

### Preferred Alternative
```php
// Use CastsAttributes for bidirectional transformation
class EmailCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): string
    {
        return strtolower(trim($value));
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        return [$key => strtolower(trim($value))];
    }
}
```

### Refactoring Strategy
1. Identify inbound casts where the read value needs transformation
2. Determine if the read transformation logic is scattered or centralized
3. Convert the inbound cast to `CastsAttributes` implementing both `get()` and `set()`
4. Remove all manual read-side transformations from callers
5. Remove any workaround accessors that duplicate the `get` logic

### Detection Checklist
- [ ] Review each `CastsInboundAttributes` implementation for read-time transformation needs
- [ ] Search for manual transformation of the attribute value in controllers, views, and API resources
- [ ] Check if the stored value is directly usable in business logic without modification
- [ ] Count accessor or formatting workarounds that exist solely for the read direction

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use CastsInboundAttributes for Write-Only Normalization Only |
| Decision Tree | `07-decision-trees.md` — Decision 1: Inbound vs Bidirectional vs Accessor |
| Knowledge | `04-standardized-knowledge.md` — When NOT To Use (bidirectional needed) |

---

## 2. Adding get() to an Inbound Cast

### Category
Framework Usage

### Description
Implementing a `get()` method on a class that implements `CastsInboundAttributes`. The interface explicitly signals write-only behavior, but adding `get()` creates a hybrid pattern that violates the contract's intent and confuses developers.

### Why It Happens
Developers are accustomed to `CastsAttributes` which requires both methods. When using `CastsInboundAttributes`, they add `get()` out of habit or because they discover a read-time need after initial implementation but don't switch interfaces.

### Warning Signs
- `CastsInboundAttributes` implementation that contains a `get()` method
- Code comment explaining "this read transformation isn't standard but we need it here"
- The interface is `CastsInboundAttributes` but behavior is effectively bidirectional
- Confusion in code review about whether the cast is read-transforming or not

### Why Harmful
- Misleading interface: the class says write-only but performs read transformations
- Inconsistent pattern: developers scanning inbound casts expect no `get()`, then encounter one that does
- Violates principle of least surprise — the interface name should accurately describe behavior
- Makes it harder to audit casts for write-only behavior

### Consequences
- Developers cannot trust the interface name to convey intent
- Code reviews must check each inbound cast individually for hidden `get()` methods
- Refactoring risk: converting bidirectional needs out of inbound casts requires hunting for `get()` methods
- Inconsistent patterns across the codebase

### Preferred Alternative
```php
// Don't add get() to inbound cast — switch to CastsAttributes
class NormalizeCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): string
    {
        return strtolower(trim($value));
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        return [$key => strtolower(trim($value))];
    }
}
```

### Refactoring Strategy
1. Find all inbound casts with a `get()` method
2. If read transformation is genuine, switch the interface to `CastsAttributes`
3. If `get()` is unintentional or unnecessary, remove it
4. Update tests to match the corrected interface

### Detection Checklist
- [ ] Search for `implements CastsInboundAttributes` combined with `function get(`
- [ ] Review the `get()` implementation — is it a real transformation or placeholder?
- [ ] Check tests for `get()` coverage on inbound casts
- [ ] Verify the cast is used in contexts where `get()` behavior is expected

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Implement get() With CastsInboundAttributes |
| Decision Tree | `07-decision-trees.md` — Decision 3: Only set vs Adding get |
| Skill | `06-skills.md` — Step 2: Implement only set(), no get() |

---

## 3. Undocumented One-Directional Behavior

### Category
Maintainability

### Description
A `CastsInboundAttributes` implementation that has no docblock or documentation explaining that it provides no read transformation. Developers expecting bidirectional behavior (as with `CastsAttributes`) are surprised when the attribute returns raw values on read.

### Why It Happens
The interface distinction seems obvious to the developer who writes it. No one documents what seems obvious until the first time a teammate is confused. Teams don't enforce docblock standards for cast classes.

### Warning Signs
- Inbound cast class with no class-level docblock
- Developers asking in code review or chat "does this cast transform on read?"
- Time spent debugging why a cast attribute returns unexpected raw values on read
- Team members adding manual transformation after reading the attribute because they don't know it's write-only

### Why Harmful
- Every developer using the attribute must discover its read behavior through trial, error, or reading source
- Debugging time wasted tracing unexpected raw values in views and business logic
- Inconsistent understanding across the team — some developers know it's write-only, others don't
- Risk of business logic using raw stored values instead of domain-appropriate representations

### Consequences
- Repeated questions about cast behavior during development
- Time wasted reading cast source code to determine read behavior
- Potential bugs from business logic incorrectly using raw stored values
- Higher onboarding friction for new team members

### Preferred Alternative
```php
/**
 * Inbound-only cast: hashes values on write using bcrypt.
 * On read, the stored hash is returned as-is.
 * Use Hash::check() for verification — the original value cannot be recovered.
 */
class HashedCast implements CastsInboundAttributes
{
    public function set(...): array { /* ... */ }
}
```

### Refactoring Strategy
1. Identify all `CastsInboundAttributes` implementations without docblocks
2. Add a class-level docblock explaining the write-only behavior
3. Include guidance on how the read value should be used (with examples)
4. Establish a team convention that all cast classes must have docblocks

### Detection Checklist
- [ ] Search for `implements CastsInboundAttributes` and check for class docblocks
- [ ] Review existing docblocks for the "inbound-only" or "write-only" explanation
- [ ] Survey team for understanding of each inbound cast's read behavior
- [ ] Check onboarding materials or team wiki for cast documentation standards

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Document the One-Directional Nature |
| Skill | `06-skills.md` — Step 4: Document the one-directional nature |
| Knowledge | `04-standardized-knowledge.md` — Document the one-directional nature |

---

## 4. Raw Value Exposed Without Read Formatting

### Category
Design

### Description
Using `CastsInboundAttributes` alone when the raw stored value needs display formatting on read (masking, truncation, label formatting). The raw database value (hash, encoded string, internal code) leaks into views and API responses without transformation.

### Why It Happens
Developers focus on the write normalization (which works correctly) and don't consider read-side presentation. The inbound cast handles the security/encoding concern, but the raw format is not suitable for display. No accessor is created to handle read formatting.

### Warning Signs
- Raw hash values displayed in views or API responses
- Callers manually formatting the attribute value in Blade templates or API resources
- Repeated `substr()`, `Hash::check()`, masking logic scattered across the codebase
- No accessor exists for the inbound-cast attribute

### Why Harmful
- Raw internal representations exposed to users and API consumers
- Formatting logic duplicated across every usage site instead of centralized in an accessor
- Inconsistent formatting: one template masks differently than another
- Security concern: raw values (even hashes) may leak information if not masked

### Consequences
- Poor user experience: raw hashes, encoded strings, or internal codes in the UI
- Duplicated formatting logic across controllers and templates
- Inconsistent display formatting across the application
- Higher maintenance burden when formatting requirements change

### Preferred Alternative
```php
class HashedSsn implements CastsInboundAttributes
{
    public function set(...): array
    {
        return [$key => Hash::make($value)];
    }
}

// In model: accessor for display
protected function ssnDisplay(): Attribute
{
    return Attribute::make(get: fn () => '***-**-' . substr($this->ssn, -4));
}
```

### Refactoring Strategy
1. Identify inbound casts whose raw stored values appear in views or API responses
2. For each, determine the appropriate display format
3. Add an accessor on the model that formats the raw value for display
4. Update views and API resources to use the accessor instead of the raw attribute
5. Consider adding `$appends` for the display accessor if needed

### Detection Checklist
- [ ] Review views and API resources for inbound-cast attribute usage
- [ ] Check if raw hashes, encoded strings, or internal codes appear in output
- [ ] Search for manual formatting of cast attributes outside the model
- [ ] Verify every inbound cast has a corresponding accessor if display formatting is needed

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Combine CastsInboundAttributes With Accessors for Read Formatting |
| Decision Tree | `07-decision-trees.md` — Decision 2: Inbound Cast Alone vs Paired with Accessor |
| Skill | `06-skills.md` — Step 5: Pair with an accessor if read formatting needed |

---

## 5. Incorrect set Return Structure

### Category
Reliability

### Description
Returning a non-associative array, a scalar value, or a malformed structure from the `set()` method of a `CastsInboundAttributes` implementation. Returns numeric arrays, missing column keys, or incorrect types.

### Why It Happens
The interface contract for `set()` is the same as `CastsAttributes::set()` but developers may treat `CastsInboundAttributes` as simplified and skip reading the contract. Numeric arrays `[bcrypt($value)]` instead of associative `[$key => bcrypt($value)]` are a common mistake.

### Warning Signs
- `set()` returns `[transformed($value)]` (numeric array, missing key)
- `set()` returns a scalar value instead of an array
- Model saves don't persist the transformed value correctly
- Debugging shows the original untransformed value in the database after save

### Why Harmful
- The attribute value assigned to the model is incorrect — Eloquent uses the returned array to hydrate model attributes
- Numeric arrays are merged as numeric-model attributes, causing data corruption
- Silent failure: the model appears to accept the value but the database stores the wrong data
- Debugging difficult because the error is in the return structure, not the transformation logic

### Consequences
- Data corruption: wrong values stored to the database
- Incorrect attribute assignment after model save
- Wasted debugging time tracing why transformed values don't persist
- Silent data loss if the transform is critical (hashing, encoding)

### Preferred Alternative
```php
public function set(Model $model, string $key, mixed $value, array $attributes): array
{
    return [$key => bcrypt($value)];
}
```

### Refactoring Strategy
1. Identify inbound casts with incorrect `set()` return structures
2. Ensure `set()` always returns `[$key => $value]` for single-attribute casts
3. For multi-attribute casts, ensure all keys are column names
4. Add tests that assert `set()` return type and structure

### Detection Checklist
- [ ] Search for `function set(.*): array` in inbound casts — check return statements
- [ ] Look for numeric array syntax `[value]` instead of `[$key => value]`
- [ ] Check for scalar returns (not array) from `set()`
- [ ] Test: save a model and verify the database contains the transformed value

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Return Array of Key-Value Pairs From set |
| Knowledge | `04-standardized-knowledge.md` — Return contract |
| Skill | `06-skills.md` — Step 3: Return an associative array |

---

## 6. Inbound Cast for Non-Normalization Logic

### Category
Design

### Description
Using `CastsInboundAttributes` for write-time transformation that isn't normalization — such as dispatching jobs, logging, counting, or triggering side effects on attribute assignment. The interface is for data transformation, not for orchestrating behavior.

### Why It Happens
Developers see `set()` as a convenient hook that fires whenever the attribute is assigned. This seems useful for logging changes, dispatching notifications, or updating counters — but these belong in model events or explicit methods.

### Warning Signs
- Inbound cast that dispatches jobs, sends emails, or logs on every assignment
- Cast that updates counters, timestamps, or other model attributes as side effects
- Cast whose name suggests behavior (NotificationCast, LogCast) rather than transformation (HashCast, EncodeCast)
- Side effects that happen during model hydration, not just user assignment

### Why Harmful
- Side effects execute on every attribute assignment, including during model hydration from the database
- Casts are not the right layer for behavioral side effects — use model events or explicit methods
- Testing the cast requires mocking side effects, complicating unit tests
- Breaking the Single Responsibility Principle: the cast both transforms data and triggers behavior

### Consequences
- Duplicate notifications, logs, or counter updates during model hydration
- Side effects executing in contexts where they shouldn't (queue jobs, Artisan commands, tests)
- Harder to test the cast in isolation
- Hidden coupling between attribute assignment and application behavior

### Preferred Alternative
```php
// Cast handles data transformation only
class EncodeCast implements CastsInboundAttributes
{
    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        return [$key => json_encode($value)];
    }
}

// Side effects in model events or explicit methods
class User extends Model
{
    protected static function booted(): void
    {
        static::saved(function ($user) {
            if ($user->wasChanged('preferences')) {
                Log::info('Preferences updated', ['user_id' => $user->id]);
            }
        });
    }
}
```

### Refactoring Strategy
1. Identify side effects in inbound cast `set()` methods (dispatch, log, save, update)
2. Extract each side effect to an Eloquent model event or explicit service method
3. Keep the cast focused on data transformation only
4. Update tests to verify the side effect at the event/method level, not in the cast

### Detection Checklist
- [ ] Search for `dispatch(`, `Log::`, `Mail::`, `event(` in inbound cast `set()` methods
- [ ] Search for `$model->save(`, `$model->update(` in cast methods
- [ ] Check if the cast name implies behavioral logic rather than transformation
- [ ] Review cast test files for side effect assertions

### Related
| Reference | Link |
|---|---|
| Knowledge | `04-standardized-knowledge.md` — Use for one-directional data normalization |
| Rule | `05-rules.md` — Use CastsInboundAttributes for Write-Only Normalization Only |
| Decision Tree | `07-decision-trees.md` — Decision 1: Write-only normalization |
