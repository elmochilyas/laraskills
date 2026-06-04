# Strategy Pattern in Domain — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | strategy-pattern-in-domain |

## Rules

### Rule 1: Define strategy interface with single method
Each strategy interface must define a single method with clear parameters and return type. Multi-method interfaces suggest the strategy has multiple responsibilities.

### Rule 2: Implement concrete strategies per variant
Each domain algorithm variant gets its own concrete strategy class. No conditional logic inside strategies — each implements one algorithm completely.

### Rule 3: Decouple selection from execution
Strategy selection logic should be separate from the strategy implementations. The caller selects a strategy and then executes it in separate steps.

### Rule 4: Inject strategies via DI container
Strategies must be injected through the constructor, not instantiated with `new` inside the caller. This enables swapping strategies for testing.

### Rule 5: Open/closed — add strategies without modification
Adding a new strategy variant must not require changes to existing strategy classes. Only the selection logic may need updating to recognize the new variant.
