# Trait Decomposition — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Design |
| Knowledge Unit | Trait Decomposition |
| Focus | Anti-patterns in trait boot/init usage, naming, organization, and decomposition |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Trait Overrides Model `boot()` Instead of Using `boot{TraitName}()` | Architecture | Critical |
| 2 | Using `boot{TraitName}` for Instance Defaults | Reliability | High |
| 3 | Single-Use Traits | Code Organization | Medium |
| 4 | Monolithic Multi-Concern Traits | Design | Medium |
| 5 | Traits for Complex Event Logic (Should Be Observers) | Design | Medium |
| 6 | Traits for Attribute Transformation (Should Be Casts) | Design | Low |
| 7 | Undocumented Trait-to-Trait Dependencies | Maintainability | Medium |
| 8 | Unresolved Trait Method Conflicts | Reliability | High |

## Repository-Wide Cross-Cutting Patterns

- Overriding the model's `boot()` method inside a trait is the most critical anti-pattern — it breaks inheritance and causes cascading failures when multiple traits define `boot()`
- Using `boot{TraitName}` for per-instance defaults causes them to be set only once per class load instead of per new instance
- Complex event logic belongs in observers, not traits; attribute transformation belongs in custom casts, not traits

---

## 1. Trait Overrides Model `boot()` Instead of Using `boot{TraitName}`

### Category
Architecture

### Description
Defining a `boot()` method inside a PHP trait used by an Eloquent model, instead of using Eloquent's `boot{TraitName}()` convention, causing the trait to override the model's own `boot()` method.

### Why It Happens
Developers are familiar with `boot()` from model classes and use it inside traits without knowing about the `boot{TraitName}()` convention. The code "works" until a second trait also defines `boot()`.

### Warning Signs
- `public static function boot()` defined inside a trait
- `parent::boot()` calls inside a trait's boot method
- Two traits both define `boot()` — PHP throws a fatal error about method collision
- Model boot events fail to register for some traits

### Why Harmful
- Only one trait's `boot()` can win — the second trait causes a fatal PHP error
- Removing or reordering traits breaks boot logic
- The trait cannot be used on models that already define `boot()`

### Preferred Alternative
```php
trait Auditable
{
    protected static function bootAuditable(): void
    {
        static::creating(fn ($model) => Log::info('Creating', ['model' => $model]));
    }
}
```

### Detection Checklist
- [ ] Search for `function boot()` inside trait definitions
- [ ] Replace with `boot{TraitName}()` convention
- [ ] Verify all event listeners still fire after refactoring

### Related
| Rule | `05-rules.md` — Use `boot{TraitName}` for Event and Scope Registration |
| Decision Tree | `07-decision-trees.md` — boot{TraitName} vs initialize{TraitName} Usage |

---

## 2. Using `boot{TraitName}` for Instance Defaults

### Category
Reliability

### Description
Setting default attribute values for trait-managed columns inside `boot{TraitName}()` (static, runs once per class load) instead of `initialize{TraitName}()` (runs per new instance).

### Why It Happens
Developers use `boot{TraitName}()` as the default hook for all trait setup logic, not distinguishing between class-level setup (event registration) and instance-level setup (default values).

### Warning Signs
- `boot{TraitName}()` registers a `creating` event solely to set a default value
- Default values are set only once per class load and don't apply to new instances
- `$model = new Model()` creates an instance without the expected default value
- Comments like "this should be in initialize but works in boot via creating"

### Preferred Alternative
```php
trait HasStatus
{
    public function initializeHasStatus(): void
    {
        if (! isset($this->status)) {
            $this->status = 'pending';
        }
    }
}
```

### Detection Checklist
- [ ] Review each `boot{TraitName}()` — does it set instance-level defaults?
- [ ] Move defaults to `initialize{TraitName}()`
- [ ] Verify defaults apply to `new Model()` not created via factory

### Related
| Rule | `05-rules.md` — Use `initialize{TraitName}` for Default Attribute Values |
| Decision Tree | `07-decision-trees.md` — boot{TraitName} vs initialize{TraitName} Usage |

---

## 3. Single-Use Traits

### Category
Code Organization

### Description
Extracting a PHP trait for cross-cutting behavior that is only used by one model, adding unnecessary indirection and file count.

### Why It Happens
Developers follow the principle of "extract reusable code" too aggressively, creating traits for behavior that may never be reused. The pattern feels "clean" but adds navigation cost.

### Warning Signs
- Trait used by exactly one model
- `grep -r "use TraitName"` returns only one result
- Trait file has more lines than the model that uses it
- Behavior is tightly coupled to a single model's internals

### Preferred Alternative
```php
class Order extends Model
{
    public function calculateDiscount(): float
    {
        return $this->total * 0.1;
    }
}
```

### Detection Checklist
- [ ] Count usage of each trait — single-use traits should be inlined
- [ ] Check if the trait's behavior is truly cross-cutting or model-specific
- [ ] Inline single-use traits into their only consumer

### Related
| Rule | `05-rules.md` — Never Use Traits for Single-Model Behavior |

---

## 4. Monolithic Multi-Concern Traits

### Category
Design

### Description
Combining multiple unrelated cross-cutting concerns into a single trait (e.g., `HasAuditAndSlugs`), violating the Single Responsibility Principle and reducing reusability.

### Why It Happens
Two concerns are often used together, so developers combine them for convenience. When a third model needs only one of the concerns, the monolithic trait forces unwanted behavior.

### Warning Signs
- Trait name contains "And" (e.g., `HasAuditAndSlugs`, `InteractsWithMediaAndCache`)
- Trait with multiple `boot{Concern}` methods inside the same trait
- Models that use the trait and override parts of it to disable unwanted behavior
- Comments like "we only use the audit part but the trait also generates slugs"

### Preferred Alternative
```php
trait HasSlug
{
    public function initializeHasSlug(): void
    {
        $this->slug ??= Str::slug($this->title);
    }
}

trait HasAudit
{
    protected static function bootHasAudit(): void
    {
        static::created(fn ($m) => Log::info('Created', ['id' => $m->id]));
    }
}
```

### Detection Checklist
- [ ] Review each trait for multiple unrelated responsibilities
- [ ] Split into separate single-concern traits
- [ ] Verify each split trait is independently usable

### Related
| Rule | `05-rules.md` — Keep Traits Focused on a Single Concern |
| Skill | `06-skills.md` — Decompose Cross-Cutting Model Behavior into Traits |

---

## 5. Traits for Complex Event Logic (Should Be Observers)

### Category
Design

### Description
Implementing complex, multi-step event logic (external API calls, conditional workflows, multi-model operations) inside a trait's `boot{TraitName}()` method instead of a dedicated observer class.

### Why It Happens
Traits are the first tool developers reach for when they need to add behavior to a model. They don't consider observers as an alternative for event-only concerns.

### Warning Signs
- `boot{TraitName}()` contains 20+ lines of event handling logic
- Trait boot methods inject services via `app()`
- Event logic makes external API calls, sends emails, or performs complex branching
- Testing the trait requires mocking multiple external services

### Preferred Alternative
```php
// Observer class
class CrmSyncObserver
{
    public function saved(Model $model): void
    {
        app(CrmService::class)->syncCustomer($model);
    }
}

// On model:
#[ObservedBy(CrmSyncObserver::class)]
class Order extends Model
{
    //
}
```

### Detection Checklist
- [ ] Review trait boot methods for complex event logic
- [ ] Extract event-only logic to observer classes
- [ ] Replace trait usage with `#[ObservedBy]` attribute

### Related
| Rule | `05-rules.md` — Prefer Observers Over Traits for Complex Event Logic |
| Decision Tree | `07-decision-trees.md` — Trait vs Observer for Cross-Cutting Concerns |

---

## 6. Traits for Attribute Transformation (Should Be Casts)

### Category
Design

### Description
Implementing attribute serialization, formatting, or type coercion using trait-based accessors and mutators instead of custom cast classes.

### Why It Happens
Accessors and mutators are the traditional way to transform attributes. Custom cast classes are a newer, more focused alternative that developers may not know about.

### Warning Signs
- Trait contains `get{Attribute}Attribute()` and `set{Attribute}Attribute()` methods
- The accessor/mutator transforms a single attribute value (not a computed property)
- The same transformation pattern appears across multiple traits

### Preferred Alternative
```php
class MoneyCast implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes): int
    {
        return (int) $value;
    }

    public function set($model, string $key, $value, array $attributes): int
    {
        return (int) round($value * 100);
    }
}

// On model:
protected function casts(): array
{
    return ['total_cents' => MoneyCast::class];
}
```

### Detection Checklist
- [ ] Search for attribute accessors/mutators inside traits
- [ ] Extract single-attribute transformations to custom casts
- [ ] Keep accessors only for computed/multi-attribute properties

### Related
| Rule | `05-rules.md` — Prefer Custom Casts Over Traits for Attribute Transformation |
| Decision Tree | `07-decision-trees.md` — Trait vs Custom Cast |

---

## 7. Undocumented Trait-to-Trait Dependencies

### Category
Maintainability

### Description
Creating a trait that depends on another trait (e.g., calls methods from it) without documenting the dependency, causing runtime errors when used in isolation.

### Why It Happens
The dependency is implicit — the trait assumes another trait is present because they're always used together. When a developer discovers the trait independently, they miss the dependency.

### Warning Signs
- Trait calls `$this->methodName()` that is defined in another trait
- Runtime "Call to undefined method" errors when using the trait alone
- No docblock or comment listing required companion traits
- Developers must search the codebase to find which other traits are needed

### Preferred Alternative
```php
/**
 * Requires: SoftDeletes
 * Optional: HasBlameable (adds user_id to audit log)
 */
trait HasAudit
{
    protected static function bootHasAudit(): void
    {
        static::deleting(fn ($model) => Log::info('Deleting'));
    }
}
```

### Detection Checklist
- [ ] Review each trait for implicit dependencies on other traits
- [ ] Add `@requires` docblock for each dependency
- [ ] Test each trait in isolation to verify it documents missing dependencies

### Related
| Rule | `05-rules.md` — Document Trait-to-Trait Dependencies Explicitly |
| Skill | `06-skills.md` — Decompose Cross-Cutting Model Behavior into Traits |

---

## 8. Unresolved Trait Method Conflicts

### Category
Reliability

### Description
Two traits used on the same model define methods with the same name, and no `insteadof` or `as` resolution is declared in the model, leaving the winner dependent on `use` declaration order.

### Why It Happens
Developers don't notice the conflict until it causes a bug. The `use` order determines the winner, which is not visible from reading the model's method calls.

### Warning Signs
- Two traits both define `calculateTotal()` or another method with the same name
- The model class has no `insteadof` or `as` resolution
- Reordering the `use` statement changes behavior
- Comments like "the order matters here" without explicit resolution

### Preferred Alternative
```php
class Order extends Model
{
    use HasDiscount, HasPromotion {
        HasDiscount::calculateTotal insteadof HasPromotion;
        HasPromotion::calculateTotal as calculatePromotionTotal;
    }
}
```

### Detection Checklist
- [ ] Check each model for traits with overlapping method names
- [ ] Add explicit `insteadof` and `as` resolution
- [ ] Verify the resolved method is the correct one

### Related
| Rule | `05-rules.md` — Resolve Trait Method Conflicts Explicitly |
| Skill | `06-skills.md` — Decompose Cross-Cutting Model Behavior into Traits |
