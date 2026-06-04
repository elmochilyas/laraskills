# Strategy Pattern in Domain — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | strategy-pattern-in-domain |

## Anti-Patterns

### Strategy Pattern for Two Simple Variants
- **Severity:** Medium
- **Problem:** Implementing the full strategy pattern (interface, two concrete classes, selector, DI wiring) for a simple binary choice that could be handled by a conditional.
- **Solution:** Use a conditional (if/else/match) for 2-3 stable variants. Only escalate to the strategy pattern when variants grow or change frequently.

### Strategy Interface with Multiple Methods
- **Severity:** Medium
- **Problem:** A strategy interface with 3+ methods forces every strategy to implement all of them, even if some don't apply. This violates Interface Segregation.
- **Solution:** Split into multiple single-method strategy interfaces. Alternatively, provide default method implementations.

### Strategies with Side Effects
- **Severity:** High
- **Problem:** A strategy performs side effects (sending emails, writing logs, API calls) during computation, making it impossible to use the strategy purely for calculation.
- **Solution:** Strategies should compute and return values. Side effects belong in the caller or in domain event listeners.

### Inline Strategy Instantiation
- **Severity:** Medium
- **Problem:** The caller does `new StandardShippingStrategy()` instead of receiving it via DI, making it impossible to swap strategies for testing without changing the caller's code.
- **Solution:** Inject strategy and selector dependencies through the constructor.
