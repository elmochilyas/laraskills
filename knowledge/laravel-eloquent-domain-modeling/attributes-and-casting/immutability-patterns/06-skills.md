# Immutability Patterns — Skills

---

## Skill 1: Design an Immutable Value Object With Readonly Properties

### Purpose
Create an immutable value object using PHP 8.1 `readonly` properties so the object cannot be modified after construction, preventing accidental mutation through shared references.

### When To Use
- Your value objects are shared across multiple contexts
- You want to prevent accidental mutation through property references
- You follow functional programming practices in domain logic

### When NOT To Use
- The value object is short-lived and never shared
- Performance profiling demonstrates readonly overhead is a bottleneck (rare)
- The object is a DTO serialized once (immutability adds ceremony)

### Prerequisites
- PHP 8.1+
- Understanding of value object semantics

### Inputs
- Value object class name
- Property names and types
- Operation methods (add, subtract, withAmount, etc.)

### Workflow

1. **Declare all properties as `readonly`** in the constructor:
   ```php
   class Money
   {
       public function __construct(
           public readonly int $cents,
           public readonly string $currency = 'USD',
       ) {}
   }
   ```

2. **Define operations that return new instances**:
   ```php
   public function add(Money $other): Money
   {
       return new self($this->cents + $other->cents, $this->currency);
   }
   ```

3. **Use named constructors with `with*()` prefix** for modified copies:
   ```php
   public function withAmount(int $cents): Money
   {
       return new self($cents, $this->currency);
   }
   ```

4. **Do not expose setters** — only named constructors or static factories

5. **Combine with `CarbonImmutable`** for date attributes on models

### Validation Checklist
- [ ] All value object properties are `readonly`
- [ ] No setters exist on value objects
- [ ] Modification operations return new instances
- [ ] Date attributes use `immutable_datetime` cast

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Property still mutable | `readonly` modifier forgotten | Always use `readonly` properties |
| Original mutated | Method modifies `$this` instead of returning new instance | Return new `self()` |
| Inconsistent immutability | Mutable Carbon mixed with immutable objects | Use `immutable_datetime` consistently |

### Decision Points
- **Shared across multiple contexts?** → Immutability is required
- **Single-use/short-lived?** → Immutability overhead may not be justified
- **Date attributes?** → Use `CarbonImmutable` via `immutable_datetime` cast

### Performance Considerations
- Immutability creates more objects on modification — negligible for typical use
- PHP 8.1 readonly properties are optimized; no overhead compared to regular properties
- GC handles short-lived immutable objects efficiently

### Related Rules
| Rule | Reference |
|---|---|
| Mark all value object properties as readonly | `05-rules.md` |
| Return new instances from modification operations | `05-rules.md` |
| Do not expose setters on value objects | `05-rules.md` |
| Combine immutable value objects with CarbonImmutable | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Design Money, Email, Address Value Objects | Real-world immutable value objects |
| Configure Immutable Date/Time Casting | CarbonImmutable integration |
| Define a Cached Accessor | Immutability in accessor returns |
| Immutable Casting | Immutability in custom casts |

### Success Criteria
- Value object properties cannot be reassigned after construction
- Operations return new instances without modifying the original
- No public or protected setter methods exist
- Date attributes consistently use `CarbonImmutable`
