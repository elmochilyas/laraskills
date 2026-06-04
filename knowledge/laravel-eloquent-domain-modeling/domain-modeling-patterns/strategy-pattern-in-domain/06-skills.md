# Strategy Pattern in Domain — Skills

---

## Skill 1: Implement a Strategy for Variant Domain Behavior

### Purpose
Use the strategy pattern to encapsulate interchangeable domain algorithms (pricing, discount, shipping) behind an interface, selected at runtime based on context.

### When To Use
- A domain operation has multiple variants (shipping cost, discount calculation, tax rate)
- The variant is selected at runtime based on context (customer type, order value)
- You want to add new variants without modifying existing code

### When NOT To Use
- There's only one algorithm with no expected variants
- The variant can be determined by a simple if/else with low churn
- The strategy would add accidental complexity for a single variant

### Prerequisites
- Interface defining the strategy contract
- Concrete implementations for each variant
- Context object or parameters for strategy selection

### Inputs
- Strategy interface name
- Concrete strategy classes
- Selection logic (how to choose the right strategy)

### Workflow

1. **Define the strategy interface** — single method with clear parameters and return type:
   ```php
   interface ShippingCostStrategy
   {
       public function calculate(Order $order): Money;
   }
   ```

2. **Implement concrete strategies** for each variant:
   ```php
   class StandardShippingStrategy implements ShippingCostStrategy { ... }
   class ExpressShippingStrategy implements ShippingCostStrategy { ... }
   class FreeShippingStrategy implements ShippingCostStrategy { ... }
   ```

3. **Select the strategy at runtime** via a factory or service:
   ```php
   class ShippingCostCalculator
   {
       public function __construct(
           private readonly StandardShippingStrategy $standard,
           private readonly ExpressShippingStrategy $express,
           private readonly FreeShippingStrategy $free,
       ) {}
   
       public function forOrder(Order $order): ShippingCostStrategy
       {
           return match (true) {
               $order->total->greaterThan(new Money(10000)) => $this->free,
               $order->isExpress() => $this->express,
               default => $this->standard,
           };
       }
   }
   ```

4. **Inject the strategy** where it's used (not instantiated inline)

5. **Test each strategy independently** — isolate from selection logic

6. **Add new strategies** by implementing the interface — no existing code changes

### Validation Checklist

- [ ] Strategy interface has a single responsibility
- [ ] Each concrete strategy implements the full algorithm
- [ ] Strategy selection is decoupled from strategy execution
- [ ] New strategies can be added without modifying existing strategies
- [ ] Strategies are injectable (no inline instantiation)
- [ ] Each strategy is unit-testable independently

### Related Rules

| Rule | Reference |
|---|---|
| Define strategy interface with single method | `05-rules.md` Rule 1 |
| Implement concrete strategies per variant | `05-rules.md` Rule 2 |
| Decouple selection from execution | `05-rules.md` Rule 3 |
| Inject strategies via DI container | `05-rules.md` Rule 4 |
| Open/closed — add strategies without modification | `05-rules.md` Rule 5 |

### Success Criteria
- Strategy interface defines the contract cleanly
- Each variant has its own concrete strategy class
- Runtime selection picks the right strategy by context
- Adding a new strategy requires no changes to existing strategies
- Each strategy is independently testable
