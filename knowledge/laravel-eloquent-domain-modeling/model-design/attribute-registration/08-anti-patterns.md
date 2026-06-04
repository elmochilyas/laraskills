# Attribute Registration — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Design |
| Knowledge Unit | Attribute Registration |
| Focus | Anti-patterns in #[ObservedBy], #[ScopedBy], #[CollectedBy], #[UseEloquentBuilder] usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Using `boot()` or Providers Instead of Attributes | Code Organization | Medium |
| 2 | Combining Multiple Registrations in One Attribute | Code Organization | Low |
| 3 | Scattered or Unordered Attribute Declarations | Code Organization | Low |
| 4 | Duplicating Parent Attributes on Child Models | Maintainability | Medium |
| 5 | Moving Attribute Registration into Traits | Code Organization | Medium |
| 6 | Using Attributes for Runtime-Conditional Logic | Architecture | High |

## Repository-Wide Cross-Cutting Patterns

- The primary anti-pattern is continuing to use `boot()` methods or service providers for observer/scope registration when PHP 8 attributes would make the registration visible and discoverable directly on the model
- Hiding registration inside traits defeats the purpose of attributes — the model declaration should be a complete summary of all registered behavior
- Using attributes for registrations that depend on runtime state (environment, auth) fails silently because attributes are always resolved

---

## 1. Using `boot()` or Providers Instead of Attributes

### Category
Code Organization

### Description
Registering observers, scopes, collections, or builders inside model `boot()` methods or service providers when a static attribute (`#[ObservedBy]`, `#[ScopedBy]`, etc.) on the model class would suffice.

### Why It Happens
The `boot()` method and service provider patterns were the only option before PHP 8 attributes existed. Developers continue using these established patterns out of habit or lack of awareness about the attribute alternatives.

### Warning Signs
- `Model::observe()` calls in `AppServiceProvider` or dedicated observer service providers
- `static::addGlobalScope()` inside a model's `boot()` method
- `newCollection()` or `newEloquentBuilder()` method overrides on models
- Scattered configuration across multiple files makes it hard to understand what's registered on a model

### Why Harmful
- Registration is hidden in service providers or method bodies — developers must search multiple files to understand a model's behavior
- More boilerplate code than the attribute equivalent
- Onboarding new developers requires explaining the "where is this registered?" discovery pattern

### Preferred Alternative
```php
#[ObservedBy(OrderObserver::class)]
#[ScopedBy(TenantScope::class)]
#[CollectedBy(OrderCollection::class)]
#[UseEloquentBuilder(OrderBuilder::class)]
class Order extends Model
{
    //
}
```

### Detection Checklist
- [ ] Search for `Model::observe()` calls in service providers
- [ ] Search for `addGlobalScope(` in model `boot()` methods
- [ ] Search for `newCollection(` and `newEloquentBuilder(` method overrides
- [ ] Replace with equivalent attributes where registration is unconditional

### Related
| Rule | `05-rules.md` — Prefer Attributes Over Boot Method Registration |
| Rule | `05-rules.md` — Do Not Register Observers in Service Providers When Attributes Suffice |
| Decision Tree | `07-decision-trees.md` — Attribute vs boot() Registration |

---

## 2. Combining Multiple Registrations in One Attribute

### Category
Code Organization

### Description
Passing an array of classes to a single attribute (e.g., `#[ObservedBy([ObserverA::class, ObserverB::class])]`) instead of using separate stacked attributes.

### Why It Happens
Developers apply array patterns from other contexts (e.g., middleware arrays in routes) without realizing that PHP 8 attributes are designed to be stacked — one attribute per registration.

### Warning Signs
- `#[ObservedBy([...])]` with an array of observer classes
- `#[ScopedBy([...])]` with an array of scope classes
- Single attribute that combines multiple registrations in a non-standard way

### Preferred Alternative
```php
#[ObservedBy(OrderObserver::class)]
#[ObservedBy(AuditObserver::class)]
class Order extends Model
{
    //
}
```

### Detection Checklist
- [ ] Search for attribute patterns with array arguments
- [ ] Split combined attributes into separate stacked attributes
- [ ] Verify each attribute has a single class argument

### Related
| Rule | `05-rules.md` — Stack Multiple Attributes for Multiple Registrations |
| Decision Tree | `07-decision-trees.md` — Multiple Attributes Stacking Strategy |

---

## 3. Scattered or Unordered Attribute Declarations

### Category
Code Organization

### Description
Placing attribute registrations in inconsistent order or scattered across the model file (some above the class, some inside traits, some in comments), reducing readability and discoverability.

### Why It Happens
No team convention exists for attribute ordering. Different developers add attributes in different places as the model evolves.

### Warning Signs
- Attributes placed both above the class and inside the class body
- No consistent ordering (`#[ObservedBy]` after `#[ScopedBy]` in some models, before in others)
- Attributes interleaved with comments or docblocks that could be consolidated

### Preferred Alternative
```php
#[ObservedBy(OrderObserver::class)]
#[ScopedBy(TenantScope::class)]
#[CollectedBy(OrderCollection::class)]
#[UseEloquentBuilder(OrderBuilder::class)]
class Order extends Model
{
    //
}
```

### Detection Checklist
- [ ] Review attribute ordering across all models
- [ ] Establish a team convention (e.g., ObservedBy, ScopedBy, CollectedBy, UseEloquentBuilder)
- [ ] Move all attributes to a single block above the class declaration

### Related
| Rule | `05-rules.md` — Group All Attribute Registrations Together |

---

## 4. Duplicating Parent Attributes on Child Models

### Category
Maintainability

### Description
Repeating the same attribute registrations (e.g., `#[ObservedBy(AuditObserver::class)]`) on child models when they are already inherited from a parent or base model class.

### Why It Happens
Developers explicitly add attributes to every model for "clarity" without understanding that attributes are inherited. They may also not trust that inheritance works correctly.

### Warning Signs
- Base model has `#[ObservedBy(AuditObserver::class)]` and child models repeat the same attribute
- Updating the attribute on the base model requires also updating all child models
- Some child models may be missed during updates, creating inconsistent behavior

### Preferred Alternative
```php
#[ObservedBy(AuditObserver::class)]
class BaseModel extends Model { /* ... */ }

// Attribute inherited — no need to repeat
class User extends BaseModel { /* ... */ }
```

### Detection Checklist
- [ ] Check for attributes on child models that duplicate parent attributes
- [ ] Remove duplicates and verify behavior is unchanged
- [ ] Document inheritance in team conventions

### Related
| Rule | `05-rules.md` — Verify Child Model Attribute Inheritance |

---

## 5. Moving Attribute Registration into Traits

### Category
Code Organization

### Description
Placing `#[ObservedBy]` or other registration attributes inside a trait instead of on the model class, hiding the registration from developers who only look at the model declaration.

### Why It Happens
Developers associate the observer with the behavior provided by the trait. They add the attribute to the trait thinking it's "part of" the trait functionality.

### Warning Signs
- `#[ObservedBy(...)]` inside a trait that is used on the model
- Model class declaration has no attributes, but the model has registered observers
- Developers must inspect every trait to understand what is registered on the model

### Preferred Alternative
```php
#[ObservedBy(AuditObserver::class)]
class Order extends Model
{
    use HasAudit; // Trait handles behavior, not registration
}
```

### Detection Checklist
- [ ] Search for attributes inside trait definitions
- [ ] Move registration attributes from traits to the model class
- [ ] Keep traits focused on behavior implementation

### Related
| Rule | `05-rules.md` — Combine Attribute Registration with Trait Decomposition |

---

## 6. Using Attributes for Runtime-Conditional Logic

### Category
Architecture

### Description
Using `#[ObservedBy]` or `#[ScopedBy]` for registration that should only apply in certain environments or under specific runtime conditions, since attributes always register regardless of runtime state.

### Why It Happens
Developers prefer the attribute syntax for all registration and don't consider that attributes are resolved at class-load time, not at runtime. The conditional registration fails silently — the observer always fires.

### Warning Signs
- Observer should only fire in non-production environments but is registered via `#[ObservedBy]`
- Scope should only apply when a feature flag is enabled but is registered via `#[ScopedBy]`
- Runtime conditions in the observer/scope class constructor as a workaround
- Comments like "this observer checks environment inside handle()"

### Preferred Alternative
```php
#[ObservedBy(OrderObserver::class)]
class Order extends Model
{
    protected static function boot(): void
    {
        parent::boot();
        if (config('features.audit')) {
            static::observe(AuditObserver::class);
        }
    }
}
```

### Detection Checklist
- [ ] Review each attribute registration — should it always apply?
- [ ] Check for runtime conditions that should prevent registration
- [ ] Move conditional registrations to `boot()` with explicit condition checks

### Related
| Rule | `05-rules.md` — Keep `boot()` Reserved for Runtime-Conditional Registration |
| Decision Tree | `07-decision-trees.md` — Conditional Registration Approach |
