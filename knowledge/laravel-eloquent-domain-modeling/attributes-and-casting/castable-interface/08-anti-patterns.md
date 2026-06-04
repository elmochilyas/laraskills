# Castable Interface — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Castable Interface |
| Focus | Anti-patterns in implementing and using the Castable interface |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Complex Boot-Time Logic in castUsing | Design | Critical |
| 2 | Generic Cast Handling Unrelated Value Objects | Design | High |
| 3 | Castable on Single-Use Value Objects | Code Organization | Medium |
| 4 | Hardcoded Cast Behavior When Factory Closure Needed | Design | Medium |
| 5 | Factory Closure When Simple String Suffices | Design | Low |
| 6 | Cast Class Location Anarchy | Maintainability | Low |

## Repository-Wide Cross-Cutting Patterns

- The Castable pattern is frequently over-applied (every value object implements Castable) or under-applied (multi-model value objects registered with separate cast classes everywhere)
- `castUsing()` is a common place for creeping complexity — what starts as a simple class name return often grows into service resolution and conditional logic
- Cast class placement tends to be inconsistent within a single codebase, with cast classes scattered across multiple directories

---

## 1. Complex Boot-Time Logic in castUsing

### Category
Design

### Description
Putting service container resolution, configuration lookups, conditional logic, or external API calls inside the static `castUsing()` method. This code executes at model boot time during every request, not at attribute access time.

### Why It Happens
Developers treat `castUsing()` as a convenient factory method. Since it runs once and its result is cached by Laravel, it seems like a good place to do dynamic resolution. The distinction between "runs at boot" vs "runs at attribute access" is unclear.

### Warning Signs
- `app()->make()`, `resolve()`, `config()` calls inside `castUsing()`
- Conditional logic (if/switch) that checks environment or configuration
- Database queries or external API calls inside `castUsing()`
- `castUsing()` longer than 5 lines or containing try/catch blocks
- Application startup failures when a cast class or dependency is missing

### Why Harmful
- Every request pays the cost of complex `castUsing()` logic, even for models whose cast attributes are never accessed
- Failures in `castUsing()` crash the entire model — it's impossible to use any attribute on the model
- Boot-time logic is hard to debug — stack traces point to model initialization, not attribute access
- Configuration lookups at boot time couple cast selection to application startup, preventing lazy evaluation

### Consequences
- Increased application boot time proportional to number of Castable classes
- Fragile model classes — one misconfigured cast breaks the entire model
- Difficult debugging — `castUsing()` exceptions are wrapped in model boot errors
- Service container calls at boot time create hidden dependencies

### Preferred Alternative
```php
// Simple — returns class name only
public static function castUsing(): string
{
    return MoneyCast::class;
}

// With parameters — factory closure
public static function castUsing(): Closure
{
    return fn () => new MoneyCast(currency: 'USD');
}
```

### Refactoring Strategy
1. Identify complex logic in `castUsing()` — service resolution, conditionals, configuration lookups
2. If the logic determines which cast class to use, evaluate at a different lifecycle point or use a factory closure
3. If the logic configures the cast, move to a factory closure with captured values
4. If configuration must be dynamic, consider a custom cast with `CastsAttributes` that resolves configuration lazily in `get()`

### Detection Checklist
- [ ] Search for `castUsing()` methods longer than 5 lines
- [ ] Check for `app()`, `resolve()`, `config()` calls inside `castUsing()`
- [ ] Look for conditional branches or loops in `castUsing()`
- [ ] Verify `castUsing()` returns a simple string or one-line closure

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep castUsing() Simple |
| Skill | `06-skills.md` — Step 5: Keep castUsing() simple |
| Decision Tree | `07-decision-trees.md` — Decision 2: Class Name vs Factory Closure |

---

## 2. Generic Cast Handling Unrelated Value Objects

### Category
Design

### Description
Creating a single cast class that handles serialization for multiple semantically unrelated value objects, using conditional logic based on the attribute key or model type to determine the serialization behavior.

### Why It Happens
Developers see redundant structure across cast classes and attempt to DRY them up by creating a single generic cast. This seems efficient but couples unrelated domain concepts.

### Warning Signs
- Cast class with `match ($key)`, `switch`, or if/else for different attribute names
- Cast class that handles both Email and Phone, or both Money and Percentage
- Cast class longer than 100 lines handling multiple transformation types
- Adding support for a new value object requires modifying an existing cast class

### Why Harmful
- Violates Single Responsibility Principle — the cast handles multiple unrelated serialization formats
- Couples unrelated value objects — changing Email serialization logic risks breaking Phone serialization
- Testing becomes complex — must test all attribute paths in one test suite
- The attribute key (string) becomes the discriminator, which is fragile and implicit
- Adding a new value object requires modifying an existing, working cast class

### Consequences
- Cast class grows with each new value object, becoming harder to maintain
- Unrelated value objects become coupled through shared cast logic
- Testing the cast requires understanding all value objects it handles
- Attribute key renames break serialization silently
- Violation of Open/Closed Principle — adding new types requires modifying existing code

### Preferred Alternative
```php
// Dedicated cast class per value object
class EmailCast implements CastsAttributes { /* Email-specific serialization */ }
class PhoneCast implements CastsAttributes { /* Phone-specific serialization */ }
```

### Refactoring Strategy
1. Identify cast classes with conditional logic based on attribute keys or model types
2. Extract each conditional branch into its own dedicated cast class
3. Create separate value objects if they don't exist
4. Update all model `$casts` arrays to reference the appropriate cast class
5. Delete the generic cast class

### Detection Checklist
- [ ] Search for `$key`, `$attribute` used as a discriminator in cast `get()`/`set()`
- [ ] Look for `match` or `switch` statements inside cast class methods
- [ ] Check if the cast class name suggests generic behavior (GenericCast, CommonCast, AttributeCast)
- [ ] Review cast class test file — does it test fundamentally different behaviors?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — One Cast Class Per Value Object |
| Knowledge | `04-standardized-knowledge.md` — Don't reuse cast classes across unrelated value objects |
| Skill | `06-skills.md` — Prerequisites: corresponding cast class for the value object |

---

## 3. Castable on Single-Use Value Objects

### Category
Code Organization

### Description
Implementing `Castable` on a value object that is used by only one model. The indirection (model → value object → cast class) adds complexity without eliminating duplication, violating YAGNI.

### Why It Happens
Teams adopt a blanket policy: "all value objects should implement Castable." This seems consistent but doesn't account for the tradeoffs of the pattern. Developers implement Castable pro-forma without evaluating actual reuse.

### Warning Signs
- Value object used in exactly one model implements `Castable`
- Single-model value object with its cast class in a separate directory
- The `Castable` import exists but provides no value — no duplicate cast references exist to eliminate
- Team convention document says "always implement Castable" without exceptions

### Why Harmful
- Unnecessary indirection: navigating the cast requires opening the value object first, then the cast class
- Extra code loaded at boot time: `castUsing()` is called for every Castable class, even single-use ones
- Violates YAGNI: the extra abstraction layer provides no measurable benefit for single-use value objects
- Creates a false sense of consistency while adding complexity

### Consequences
- More files to navigate for simple cast operations
- Marginal boot-time overhead from resolving unnecessary `castUsing()` calls
- Extra code to maintain without corresponding benefit
- New developers must understand the Castable pattern even for trivial casts

### Preferred Alternative
```php
// Single-use value object — direct cast registration is simpler
class User extends Model
{
    protected $casts = [
        'status' => StatusCast::class,
    ];
}
```

### Refactoring Strategy
1. Identify value objects implementing `Castable` that are used in only one model
2. Replace the `$casts` entry with the cast class name directly
3. Remove the `Castable` implementation from the value object
4. Keep the value object class and cast class as they are

### Detection Checklist
- [ ] Search for `implements Castable` and cross-reference with model `$casts` entries
- [ ] Count the number of models using each Castable value object
- [ ] Flag value objects used in exactly one model
- [ ] Assess if removing Castable simplifies the code without losing expressiveness

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Only Implement Castable for Multi-Model Value Objects |
| Decision Tree | `07-decision-trees.md` — Decision 1: Castable vs Separate Cast Registration |
| Skill | `06-skills.md` — When To Use (multi-model value objects) |

---

## 4. Hardcoded Cast Behavior When Factory Closure Needed

### Category
Design

### Description
Returning a simple class name string from `castUsing()` when the cast class requires constructor parameters, forcing the cast to use hardcoded defaults or impossible configuration. This prevents the value object from configuring its own serialization behavior.

### Why It Happens
Developers don't realize that `castUsing()` can return a factory closure. The class name string is the obvious first approach, and parameterization is an afterthought. The cast class may accept parameters via defaults that work for one use case but not others.

### Warning Signs
- Cast class has constructor parameters that are never configured via `castUsing()`
- Multiple value objects sharing the same cast class but needing different configurations (e.g., USD vs EUR) but using the same hardcoded values
- `castUsing()` returns a class name string but the cast class has required constructor parameters
- Separate cast classes created for minor configuration differences that could be parameterized

### Why Harmful
- Cast behavior is hardcoded even though configuration is possible — flexibility is left on the table
- Value objects that differ only in configuration (USD Money vs EUR Money) cannot reuse the same cast class with different parameters
- Forces creation of separate cast classes for each configuration variation
- The value object, which carries the configuration context, cannot pass it to the cast

### Consequences
- Hardcoded cast behavior that doesn't adapt to value object variations
- Class explosion: separate cast classes for each configuration variant
- Inconsistent behavior: the value object expresses a configuration (currency) but the cast ignores it
- Missed reuse: a single parameterized cast could handle all variations

### Preferred Alternative
```php
class Money implements Castable
{
    public function __construct(
        public readonly int $cents,
        public readonly string $currency = 'USD',
    ) {}

    public static function castUsing(): Closure
    {
        return fn () => new MoneyCast(currency: 'USD');
    }
}
```

### Refactoring Strategy
1. Identify cast classes that accept constructor parameters but are registered via class name string
2. Create a factory closure in `castUsing()` that passes the appropriate configuration
3. If the configuration depends on the value object type, capture it in the closure
4. Remove duplicate cast classes that differed only in configuration values

### Detection Checklist
- [ ] Review constructor parameters of cast classes used via `Castable`
- [ ] Check if `castUsing()` returns a string when the cast constructor has parameters
- [ ] Look for duplicate cast classes that differ only in hardcoded configuration
- [ ] Assess whether a factory closure would enable reuse across value object types

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Factory Closures for Parameterized Castable Classes |
| Rule | `05-rules.md` — Keep castUsing() Simple (closure is still simple) |
| Decision Tree | `07-decision-trees.md` — Decision 2: Class Name vs Factory Closure |

---

## 5. Factory Closure When Simple String Suffices

### Category
Design

### Description
Returning a factory closure from `castUsing()` when the cast class has no constructor parameters and no configuration is needed. The closure adds unnecessary complexity, runtime overhead, and testing difficulty compared to a simple class name string.

### Why It Happens
Developers adopt a blanket pattern of always returning closures for consistency. Tutorials and examples sometimes use closures without explaining when they are necessary. Teams may not realize that simple strings are preferred.

### Warning Signs
- `castUsing()` returns `fn () => SomeCast::class` when `SomeCast` has no constructor parameters
- All `castUsing()` methods across the codebase use closures regardless of need
- Cast class has no constructor but `castUsing()` wraps it in a closure
- Lint rules or team conventions require closures without exception

### Why Harmful
- Marginal startup overhead: each closure must be parsed, compiled, and executed during model boot
- Harder to test: closures cannot be easily inspected or mocked
- More verbose: the closure syntax is longer and less readable than a simple string
- Misleading: suggests that configuration is happening when there is none

### Consequences
- Unnecessary complexity in `castUsing()` definitions
- Marginal performance overhead from closure creation and execution at boot time
- More code to read and understand without benefit
- Inconsistent with the simpler alternative

### Preferred Alternative
```php
// Simple and clear
public static function castUsing(): string
{
    return MoneyCast::class;
}
```

### Refactoring Strategy
1. Identify all `castUsing()` methods returning closures
2. For each, check if the cast class has constructor parameters
3. If no parameters are needed, replace the closure with a simple class name string
4. Remove the `use` import for `Closure` if no longer needed

### Detection Checklist
- [ ] Search for `castUsing(): Closure` or `castUsing(): \Closure`
- [ ] Review cast class constructors for parameters
- [ ] Count closures vs strings in `castUsing()` across the codebase
- [ ] Assess if each closure actually varies its return value

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep castUsing() Simple |
| Decision Tree | `07-decision-trees.md` — Decision 2: Class Name vs Factory Closure |
| Knowledge | `04-standardized-knowledge.md` — castUsing() returns class name or factory closure |

---

## 6. Cast Class Location Anarchy

### Category
Maintainability

### Description
Cast classes placed in inconsistent, non-obvious locations across the codebase — some next to value objects, some in `App\Casts`, others in random service directories, traits directories, or model subdirectories. No discoverability convention.

### Why It Happens
No team convention for cast class placement is established early. Each developer makes their own decision, leading to fragmentation. As the codebase grows, finding the cast for a given value object requires searching.

### Warning Signs
- Cast classes found in three or more different directory locations
- Value object imports a cast class from an unexpected namespace
- Developers ask "where is the cast for X?" during code reviews
- No directory structure documentation for cast classes
- New cast classes placed in the same directory as the first one found rather than a standard location

### Why Harmful
- Time wasted searching for cast class implementations
- Difficulty during code reviews — reviewers must locate the cast class to understand its logic
- Onboarding friction: new developers must learn the ad-hoc placement conventions
- Inconsistent namespace usage prevents simple `use` statements

### Consequences
- Reduced developer productivity from searching for cast classes
- Inconsistent namespace conventions across the application
- Risk of duplicate cast classes created because existing ones couldn't be found
- Harder to enforce code quality standards on casts (no single directory to lint)

### Preferred Alternative
```php
// Convention 1: Co-located with value object
namespace App\ValueObjects;
class Email { /* ... */ }
class EmailCast implements CastsAttributes { /* ... */ }

// Convention 2: Single App\Casts directory
namespace App\Casts;
class EmailCast implements CastsAttributes { /* ... */ }
```

### Refactoring Strategy
1. Choose a team convention: co-located or `App\Casts\`
2. Move all cast classes to the chosen location
3. Update all namespace references in models and value objects
4. Add a linter rule to enforce the convention
5. Document the convention in the project's architecture documentation

### Detection Checklist
- [ ] List all cast classes with their namespace paths
- [ ] Count distinct parent directories for cast classes
- [ ] Check for cast classes in non-standard locations (Services, Helpers, Traits, Model subdirectories)
- [ ] Verify the team has an explicit convention for cast placement
- [ ] Review PRs for cast classes placed in new locations without discussion

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Place Cast Classes Alongside Value Objects or in App\Casts |
| Decision Tree | `07-decision-trees.md` — Decision 3: Co-located vs Separate Casts Directory |
| Skill | `06-skills.md` — Step 6: Place the cast class |
