# Castable Interface — Skills

---

## Skill 1: Implement Castable on a Value Object

### Purpose
Make a value object self-casting by implementing `Castable`, enabling models to register the value object class directly in `$casts` instead of a separate cast class.

### When To Use
- A value object is used across multiple models
- You want the value object to carry its own serialization logic
- You want to eliminate duplicate cast class references across models

### When NOT To Use
- The value object is used in only one model — direct cast registration is simpler
- The cast logic depends on the model context (use `CastsAttributes` directly)

### Prerequisites
- Value object class with `readonly` properties and constructor validation
- Cast class implementing `CastsAttributes` or `CastsInboundAttributes`

### Inputs
- Value object class name
- Corresponding cast class name

### Workflow

1. **Implement `Castable`** on the value object class

2. **Add `castUsing()` static method** that returns the cast class name or factory closure:
   ```php
   class Email implements Castable
   {
       public static function castUsing(): string
       {
           return EmailCast::class;
       }
   }
   ```

3. **If the cast needs constructor parameters**, return a factory closure:
   ```php
   public static function castUsing(): Closure
   {
       return fn () => new MoneyCast(currency: 'USD');
   }
   ```

4. **Register in the model** using the value object class directly:
   ```php
   protected $casts = [
       'email' => Email::class,
   ];
   ```

5. **Keep `castUsing()` simple** — no complex logic, no service resolution

6. **Place the cast class** alongside the value object or in `App\Casts\`

### Validation Checklist

- [ ] Value object implements `Castable`
- [ ] `castUsing()` returns a valid cast class name or factory closure
- [ ] `castUsing()` is simple — no complex boot-time logic
- [ ] Model registers with value object class in `$casts`
- [ ] Value object is used across multiple models (justifying the pattern)

### Related Rules

| Rule | Reference |
|---|---|
| Keep `castUsing()` simple | `05-rules.md` Rule 1 |
| One cast class per value object | `05-rules.md` Rule 2 |
| Only implement `Castable` for multi-model value objects | `05-rules.md` Rule 3 |
| Use factory closures for parameterized castable classes | `05-rules.md` Rule 4 |
| Place cast classes alongside value objects or in `App\Casts` | `05-rules.md` Rule 5 |

### Success Criteria
- Value object implements `Castable` with a simple `castUsing()` method
- Models register the value object directly in `$casts`
- No duplicate cast class references across models
- Cast class is discoverable (co-located or in `App\Casts`)
