# Runtime Casting — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Runtime Casting |
| Focus | Anti-patterns in runtime cast application |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Runtime Cast as Global Configuration Substitute | Design | Critical |
| 2 | Undocumented Runtime Cast Override | Maintainability | High |
| 3 | Broad/Untargeted Runtime Cast Application | Code Organization | Medium |
| 4 | Direct Cast Array Manipulation Instead of mergeCasts | Framework Usage | Medium |
| 5 | Using Runtime Casting for API Serialization | Architectural | High |

## Repository-Wide Cross-Cutting Patterns

- Runtime casting is frequently misused as a substitute for updating the model's global cast definition, creating scattered overrides across the codebase
- Documentation of runtime casts is almost always absent, making the override invisible to developers reading the code
- The distinction between `withCasts()` (query-level) and `mergeCasts()` (instance-level) is frequently confused

---

## 1. Runtime Cast as Global Configuration Substitute

### Category
Design

### Description
Using `withCasts()` or `mergeCasts()` repeatedly for the same cast override across multiple controllers, actions, and services, instead of updating the model's global cast definition. The same runtime cast pattern appears in dozens of places throughout the codebase.

### Why It Happens
Developers may not have access to change the model class (third-party package), or may be hesitant to modify a "shared" model. Copy-paste patterns propagate the same override across the codebase. Team members may be unaware that runtime casting should be an exception, not a pattern.

### Warning Signs
- Search for `withCasts(` or `mergeCasts(` returns 10+ results across different files
- The same cast attribute appears in multiple `withCasts()` calls
- Removing the runtime cast from one location breaks functionality (indicating the model definition is wrong)
- Controllers and services both repeat the same `withCasts(['metadata' => 'array'])`
- Comments like "temporary" or "workaround" on runtime casts that have been in production for months

### Why Harmful
- Duplicated configuration across the codebase — if the override needs to change, every usage must be updated
- New developers may not know the runtime cast exists, leading to inconsistent behavior if they forget it
- The model's `$casts` declaration becomes a misleading source of truth — it doesn't reflect actual behavior
- Maintenance burden: searching for all places where a runtime cast is applied becomes necessary for safe refactoring

### Consequences
- Scattered cast configuration that's hard to discover and maintain
- Inconsistent behavior if some code paths forget the runtime cast
- Higher cognitive load: developers must know about both the model cast and runtime overrides
- Refactoring difficulty: changing the model cast requires updating all runtime overrides
- Violation of DRY principle: same cast override repeated in multiple files

### Preferred Alternative
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

### Refactoring Strategy
1. Identify all runtime cast patterns that appear in 3+ locations
2. For each recurring override, update the model's `casts()` method to use that cast by default
3. Remove all the now-unnecessary `withCasts()` calls
4. Verify behavior is unchanged after removing runtime overrides
5. Add a comment in the model if the cast change is an intentional divergence from the database type

### Detection Checklist
- [ ] Search for `withCasts(` across the codebase with a count
- [ ] Group results by cast attribute to find recurring patterns
- [ ] Check if removing a `withCasts()` call causes test failures
- [ ] Review model's `casts()` method for attributes that are frequently overridden
- [ ] Audit comments around runtime casts for "temporary" markers

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Use Runtime Casting as Global Configuration Substitute |
| Decision Tree | `07-decision-trees.md` — Runtime Cast vs Global Model Cast |
| Skill | `06-skills.md` — Override a Cast at Runtime With withCasts |

---

## 2. Undocumented Runtime Cast Override

### Category
Maintainability

### Description
Applying `mergeCasts()` or `withCasts()` without a code comment explaining why the override is needed, what it changes, and how long it should remain. The runtime cast is invisible in the model definition, so other developers have no way to know the cast behavior has changed.

### Why It Happens
The override seems obvious at the time of writing — the developer knows why they're doing it. The invisible nature of runtime casts isn't obvious until another developer encounters the unexpected attribute behavior. Time pressure during bug fixes leads to undocumented workarounds.

### Warning Signs
- `$user->mergeCasts(['attribute' => 'type']);` with no preceding comment
- `User::withCasts([...])` with no explanation of why the override is needed
- Developers asking "why is this attribute an array here but a string in the model?"
- Debugging sessions that trace attribute type changes back to undocumented `mergeCasts`
- PRs that add runtime casts without documentation

### Why Harmful
- Other developers have no indication that the model's cast behavior has been overridden
- Time wasted debugging why an attribute returns a different type than expected from the model definition
- The override may persist past its intended lifetime with no way to know it's stale
- New team members don't know to check for runtime casts when debugging attribute behavior
- Code reviewers cannot assess whether the runtime cast is appropriate without context

### Consequences
- Duplicated debugging effort when developers encounter unexpected attribute types
- Runtime casts that outlive their original purpose
- Confusion about the model's actual cast behavior
- Reluctance to remove runtime casts for fear of breaking unknown dependencies
- Knowledge silos: only the original author knows why the cast is there

### Preferred Alternative
```php
// Legacy metadata column stored serialized data in older records.
// Override cast for this specific legacy record to handle the old format.
// Remove this override once all legacy records have been migrated (tracked in JIRA-123).
$user->mergeCasts(['metadata' => 'array']);
```

### Refactoring Strategy
1. Find all `mergeCasts()` and `withCasts()` calls without comments
2. Research why each override was added (git blame, PR history)
3. Add documentation explaining the reason, what it overrides, and when it can be removed
4. If the reason is no longer valid, remove the runtime cast
5. Establish a team convention: all runtime casts require a comment

### Detection Checklist
- [ ] Search for all `mergeCasts(` and `withCasts(` calls
- [ ] For each result, check if there's a preceding comment explaining the override
- [ ] Use `git blame` to find when each runtime cast was added and why
- [ ] Check if the original condition that required the override still exists
- [ ] Verify the override isn't already handled by a model cast change

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Document Runtime Cast Usage Clearly |
| Decision Tree | `07-decision-trees.md` — Runtime Cast vs API Resources |
| Skill | `06-skills.md` — Override a Cast at Runtime With withCasts |

---

## 3. Broad/Untargeted Runtime Cast Application

### Category
Code Organization

### Description
Applying a runtime cast at the beginning of a request handler or broadly across a controller method, far from where the overridden attribute is actually used. The runtime cast affects all subsequent attribute accesses, even those unrelated to the override's purpose.

### Why It Happens
Convenience: applying the cast early ensures it's in place when needed. The developer may not know exactly where the override is needed and applies it "just in case." The broad scope seems harmless at the time.

### Warning Signs
- `mergeCasts()` called at the start of a controller method with many lines between it and the actual attribute access
- Runtime cast applied in a constructor or middleware where it affects subsequent code
- The same `mergeCasts()` affects multiple code paths, only one of which needs it
- Difficult to trace which operation triggered a cast-related bug because the cast was applied too broadly
- Tests that pass because the runtime cast is always applied, hiding the fact that specific code paths don't need it

### Why Harmful
- Unintended side effects: the cast override changes behavior for code paths that never intended it
- Debugging difficulty: the runtime cast may be applied far from where the bug manifests
- Stale overrides: broad application makes it hard to know if the override is still needed
- Masking real data issues: a broadly applied cast may hide database data quality problems
- The override's lifetime extends beyond the specific operation that needed it

### Consequences
- Code paths using the same model instance get changed cast behavior unexpectedly
- Hard-to-trace bugs where attribute types change between the point of override and the point of use
- Unnecessarily long scope for temporary overrides
- Refactoring difficulty: extracting code may move the runtime cast's scope

### Preferred Alternative
```php
// Targeted: scope the runtime cast to the exact operation that needs it
public function exportMetadata(User $user): array
{
    $user->mergeCasts(['metadata' => 'array']);
    return $user->metadata;
}
```

### Refactoring Strategy
1. Identify broad runtime casts applied early in request handlers
2. Move each `mergeCasts()` call as close as possible to the attribute access that needs it
3. If the same override is needed in multiple places, consider a helper method
4. For controller-level broad applications, refactor to specific service methods
5. Add assertions or tests that verify the cast override is scoped correctly

### Detection Checklist
- [ ] Check the distance between `mergeCasts()` call and the first attribute access
- [ ] Review whether intervening code is affected by the cast change
- [ ] Test extracting the operation into a separate method without the runtime cast
- [ ] Verify no other code paths are incidentally affected
- [ ] Check if the runtime cast is applied before or after model relationships are loaded

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep Runtime Casting Scoped to the Specific Operation |
| Skill | `06-skills.md` — Override a Cast at Runtime With withCasts |

---

## 4. Direct Cast Array Manipulation Instead of mergeCasts

### Category
Framework Usage

### Description
Directly manipulating the model's `$casts` property or casting array (`$user->casts = [...]` or `$user->casts['attr'] = 'type'`) instead of using the documented `mergeCasts()` API. This bypasses Eloquent's internal cast resolution mechanism.

### Why It Happens
The `casts` property is public, so direct assignment seems natural. Developers may not know `mergeCasts()` exists. Legacy code written before `mergeCasts()` was introduced (Laravel 8.x) uses direct manipulation.

### Warning Signs
- `$user->casts['metadata'] = 'array';` in code
- `$user->casts = array_merge($user->casts, [...])` patterns
- Assigning to the `casts` property directly on a model instance
- Cast override works initially but produces errors after Laravel version upgrades
- Inconsistent behavior: some direct manipulations work, others don't, depending on when they're applied

### Why Harmful
- Direct property manipulation bypasses Eloquent's cast resolution and caching
- The change may not take effect if Eloquent has already resolved casts for the instance
- Behavior may differ between Laravel versions as internal cast handling changes
- The model's cast caching may return stale values after direct manipulation
- Code is less readable and more fragile than using the documented API

### Consequences
- Runtime errors when Eloquent's internal cast cache is stale
- Inconsistent behavior between Laravel versions
- Code that breaks after Eloquent internals change
- Reduced code clarity: direct property assignment is less intent-revealing than `mergeCasts()`
- Maintenance burden when upgrading Laravel

### Preferred Alternative
```php
$user->mergeCasts(['metadata' => 'array']); // Clean, documented API
```

### Refactoring Strategy
1. Find all direct `$casts` property manipulations on model instances
2. Replace each with the equivalent `mergeCasts()` call
3. If the override is applied before Eloquent initializes casts, ensure `mergeCasts()` is called after the parent constructor
4. Remove any comments about "workaround for Eloquent cast caching" if `mergeCasts()` handles it

### Detection Checklist
- [ ] Search for `->casts` followed by `=`, `[`, or `array_merge` in controller/service/model code
- [ ] Check for `$casts` property manipulation in tests set up
- [ ] Verify that `mergeCasts()` is used instead of direct assignment
- [ ] Review Laravel upgrade guides for changes to cast resolution internals
- [ ] Test cast override behavior after replacing with `mergeCasts()`

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use mergeCasts for Instance-Level Cast Changes |
| Skill | `06-skills.md` — Override a Cast at Runtime With withCasts |

---

## 5. Using Runtime Casting for API Serialization

### Category
Architectural

### Description
Using `withCasts()` or `mergeCasts()` to change attribute formats for API responses instead of using Laravel API Resources. The runtime cast approach scatters serialization logic across controllers and bypasses the Resource layer.

### Why It Happens
Quick solution: a runtime cast changes the output format in one line without creating a separate Resource class. Developers may not be aware of API Resources or think they're overkill for "one small format change." The approach works and seems simpler in the short term.

### Warning Signs
- `$user->mergeCasts(['created_at' => 'datetime:Y-m-d'])` before returning JSON
- `User::withCasts(['price' => 'decimal:2'])->get()` in an API controller
- Controllers that call `mergeCasts()` before `return response()->json()`
- No API Resource classes in the project despite multiple API endpoints
- Inconsistent serialization format for the same model across different endpoints
- `toArray()` on the model overridden instead of using API Resources

### Why Harmful
- Serialization logic scattered across controllers instead of centralized in Resources
- The serialization format varies by endpoint with no clear contract
- API Resources provide per-endpoint, per-user, per-role serialization control — runtime casting provides none of that
- Tests must be written at the controller level instead of the Resource level
- Adding a new endpoint with different serialization requires duplicating the runtime cast pattern

### Consequences
- Inconsistent API output for the same model across different endpoints
- No centralized place to understand or modify API serialization
- Controller-level serialization logic that's harder to test
- Missing the flexibility to change serialization per user role or request context
- Increased difficulty implementing API versioning

### Preferred Alternative
```php
// API Resource handles endpoint-specific serialization
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'created_at' => $this->created_at->format('Y-m-d'),
            'price' => $this->price,
        ];
    }
}
```

### Refactoring Strategy
1. Identify controllers that use `mergeCasts()` or `withCasts()` before JSON responses
2. Create API Resource classes for each model endpoint
3. Move serialization format logic from runtime casts into Resource `toArray()` methods
4. Remove runtime cast calls from controllers
5. Add Resource tests to verify serialization format per endpoint

### Detection Checklist
- [ ] Search for `mergeCasts` or `withCasts` in API controller files
- [ ] Check if API Resource classes exist in `app\Http\Resources\`
- [ ] Compare serialization format for the same model across different endpoints
- [ ] Review controller `return` statements for runtime cast patterns
- [ ] Verify no model `toArray()` overrides that duplicate Resource logic

### Related
| Reference | Link |
|---|---|
| Decision Tree | `07-decision-trees.md` — Runtime Casting vs API Resources |
| Rule | `05-rules.md` — Document Runtime Cast Usage Clearly |
| Knowledge | `04-standardized-knowledge.md` — Runtime casting is instance-scoped |
