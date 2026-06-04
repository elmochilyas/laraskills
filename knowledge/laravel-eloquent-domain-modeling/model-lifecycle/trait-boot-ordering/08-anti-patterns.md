# Trait Boot Ordering — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Trait Boot Ordering |
| Focus | Anti-patterns in use statement ordering, trait dependencies, conflict resolution, and composition |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Wrong Trait Order in `use` Statement — Dependent Trait Before Dependency | Code Organization | Critical |
| 2 | Undocumented Inter-Trait Dependencies | Maintainability | High |
| 3 | Inter-Trait Boot Dependencies (Instead of Self-Contained Traits) | Design | High |
| 4 | Untested Trait Combinations | Testing | Medium |
| 5 | Unresolved Method Conflicts Without `insteadof`/`as` | Maintainability | Critical |
| 6 | More Than 5 Traits in a Single `use` Statement | Maintainability | Medium |

## Repository-Wide Cross-Cutting Patterns

- Wrong trait ordering is the most critical anti-pattern — dependent traits boot before their dependencies, causing silent failures with no errors
- Unresolved method conflicts cause fatal PHP errors that prevent the class from being compiled
- Long `use` lists make it difficult to verify boot order and increase the risk of ordering bugs

---

## 1. Wrong Trait Order in `use` Statement — Dependent Trait Before Dependency

### Category
Code Organization

### Description
Listing traits in the `use` statement with dependent traits before their foundational dependencies, causing boot methods to execute in the wrong order and dependent setup to fail silently.

### Warning Signs
- `use HasRoles, HasTeams` where `HasRoles` depends on `HasTeams`
- Setup from the foundational trait not available when dependent trait boots
- Global scopes or event listeners missing despite being registered
- Comments like "this trait doesn't work unless reordered"

### Preferred Alternative
```php
use HasTeams,    // Foundational — boots first
    HasRoles;    // Depends on HasTeams being booted
```

### Detection Checklist
- [ ] Review each model's trait `use` statement for dependency ordering
- [ ] Identify inter-trait dependencies
- [ ] Reorder by dependency: foundational first, dependent last

### Related
| Rule | `05-rules.md` — Order Traits in the `use` Statement by Dependency — Dependencies First |

---

## 2. Undocumented Inter-Trait Dependencies

### Category
Maintainability

### Description
Traits that depend on other traits' boot methods running first, with no PHPDoc documentation of the dependency, causing ordering bugs when traits are composed on new models.

### Warning Signs
- `bootHasRoles()` calls `static::getTeamIds()` defined in `HasTeams` trait
- No `@requires` annotation on the trait
- Developers reusing the trait on a new model get wrong ordering
- Comments like "this needs to be listed after HasTeams"

### Preferred Alternative
```php
/**
 * @requires HasTeams — must be listed before HasRoles in the use statement
 */
trait HasRoles
{
    protected static function bootHasRoles(): void { /* ... */ }
}
```

### Detection Checklist
- [ ] Search for trait boot methods that reference other traits' methods
- [ ] Add `@requires` annotations to dependent traits
- [ ] Verify new model compositions respect documented ordering

### Related
| Rule | `05-rules.md` — Document Inter-Trait Dependencies in Docblocks |

---

## 3. Inter-Trait Boot Dependencies (Instead of Self-Contained Traits)

### Category
Design

### Description
Designing traits that depend on other traits' boot-time setup, rather than keeping traits self-contained and independent.

### Warning Signs
- `bootHasRoles()` calls methods defined in another trait
- Traits designed as "layers" that must stack in a specific order
- Removing or reordering one trait breaks others
- Comments like "this trait requires those traits"

### Preferred Alternative
```php
trait HasRoles
{
    protected static function bootHasRoles(): void
    {
        // Self-contained — no dependency on other traits
        static::addGlobalScope('roles', fn ($query) =>
            $query->where('active', true)
        );
    }
}
```

### Detection Checklist
- [ ] Identify all inter-trait dependencies
- [ ] Refactor to self-contained traits where possible
- [ ] Document unavoidable dependencies with `@requires`

### Related
| Rule | `05-rules.md` — Avoid Inter-Trait Dependencies Where Possible |

---

## 4. Untested Trait Combinations

### Category
Testing

### Description
Not writing tests for trait combinations that have boot-time dependencies, leaving ordering regressions undetected when traits are refactored.

### Warning Signs
- No test verifying correct boot order
- Trait refactors that break model behavior with no test failure
- Comments like "tested manually"
- Adding a new model with a trait combination that nobody has tested

### Preferred Alternative
```php
public function test_has_teams_boots_before_has_roles(): void
{
    $user = new User();
    $this->assertNotNull($user->getGlobalScope('team_scope'));
    $this->assertNotNull($user->getGlobalScope('roles_scope'));
}
```

### Detection Checklist
- [ ] Check test coverage for trait combinations
- [ ] Write tests for each distinct combination and ordering
- [ ] Add tests asserting boot-method side effects (scopes, listeners)

### Related
| Rule | `05-rules.md` — Write Tests for Each Trait Combination Order |

---

## 5. Unresolved Method Conflicts Without `insteadof`/`as`

### Category
Maintainability

### Description
Two traits defining methods with the same name without using `insteadof` or `as` to resolve the conflict, causing a fatal PHP error.

### Warning Signs
- Fatal error: "Trait method X has not been applied" or "Collision"
- PHP compilation errors when using specific trait combinations
- Comments like "cannot use both traits together"
- Deployment failures after adding a new trait

### Preferred Alternative
```php
use Loggable, Auditable {
    Auditable::log insteadof Loggable;
    Loggable::log as logToFile;
}
```

### Detection Checklist
- [ ] Check trait combinations for conflicting method names
- [ ] Add explicit `insteadof` and `as` resolution
- [ ] Verify the class compiles with all trait combinations

### Related
| Rule | `05-rules.md` — Use `insteadof` and `as` Explicitly When Traits Define Conflicting Boot Methods |

---

## 6. More Than 5 Traits in a Single `use` Statement

### Category
Maintainability

### Description
A model using more than 5 traits in its `use` statement, making it difficult to verify boot order, identify dependencies, and understand the composed behavior.

### Warning Signs
- `use` statement with 6+ traits
- Developer confusion about which traits handle which concerns
- Difficulty adding or removing traits
- Comments like "too many traits to reason about"

### Preferred Alternative
```php
class User extends Authenticatable
{
    use SoftDeletes,
        HasUuid,
        HasTeams; // 3 traits — clear and manageable
}
```

### Detection Checklist
- [ ] Review models with 5+ traits
- [ ] Extract groups into base classes or use composition
- [ ] Keep trait count manageable for readability

### Related
| Rule | `05-rules.md` — Keep the `use` Statement List Under 5 Traits for Readability |
