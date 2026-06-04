# Money, Email, Address Value Objects — Skills

---

## Skill 1: Create an Immutable Money Value Object

### Purpose
Create an immutable Money value object using `brick/money` for safe monetary arithmetic, with integer-cents representation and immutable operations.

### When To Use
- Monetary values appear throughout the application (invoices, payments, subscriptions)
- You need safe arithmetic without float precision errors
- You want to eliminate primitive obsession with monetary amounts

### When NOT To Use
- The value is used in only one place (keep as primitive)
- The monetary logic is trivial with no arithmetic
- A third-party package already provides the needed value object

### Prerequisites
- `brick/money` package installed
- PHP 8.1+ for readonly properties

### Inputs
- Amount in cents or decimal
- Currency code (ISO 4217)
- Cast class for Eloquent integration

### Workflow

1. **Install brick/money**:
   ```bash
   composer require brick/money
   ```

2. **Create the Money value object** with readonly properties:
   ```php
   class Money
   {
       public function __construct(
           public readonly int $cents,
           public readonly string $currency = 'USD',
       ) {}
   
       public function add(Money $other): Money
       {
           return new self($this->cents + $other->cents, $this->currency);
       }
   
       public function format(): string
       {
           return number_format($this->cents / 100, 2) . ' ' . $this->currency;
       }
   }
   ```

3. **Implement `Castable`** for self-casting in Eloquent models:
   ```php
   class Money implements Castable
   {
       public static function castUsing(): string
       {
           return MoneyCast::class;
       }
   }
   ```

4. **Create the custom cast** to serialize to integer cents

5. **Register in model casts**:
   ```php
   protected $casts = [
       'price' => Money::class,
   ];
   ```

### Validation Checklist
- [ ] Money uses integer cents internally (no floats)
- [ ] Arithmetic operations return new instances (immutability)
- [ ] `Castable` interface implemented for Eloquent integration
- [ ] Email normalizes and validates on construction
- [ ] Address has structured, validated components

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Float precision errors | Using PHP float for money | Use integer cents or brick/money |
| Duplicate email accounts | Case-sensitive email storage | Normalize to lowercase on construction |
| Invalid addresses stored | Unstructured string address | Use structured value object components |

### Decision Points
- **Monetary arithmetic needed?** → Use `brick/money` or integer cents
- **Email validation needed?** → Normalize to lowercase, validate with `filter_var`
- **Multiple address components?** → Use structured value object
- **Used across multiple models?** → Implement `Castable`

### Performance Considerations
- Money arithmetic with `brick/money` adds minimal overhead
- Email validation is fast (~0.01ms per call)
- Address objects with multiple fields add construction overhead per read — acceptable

### Security Considerations
- Validate email format before storage — prevents injection of malformed addresses
- Sanitize address components for XSS when rendering
- Money amounts should use integer cents internally, never floats

### Related Rules
| Rule | Reference |
|---|---|
| Use brick/money for monetary types, not float | `05-rules.md` |
| Normalize emails to lowercase on construction | `05-rules.md` |
| Store money amounts as integer cents internally | `05-rules.md` |
| Validate email format before storage | `05-rules.md` |
| Use structured value objects for addresses | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Design an Immutable Value Object | Foundation for all value objects |
| Implement Custom Casts with Castable Interface | Self-casting value objects |
| Configure Primitive Casts for Type Safety | Simpler casting alternative |

### Success Criteria
- Money uses integer cents or brick/money internally
- Email normalizes and validates on construction
- Address has structured, validated components
- Value objects implement `Castable` for Eloquent integration
- Arithmetic operations return new instances (immutability)
