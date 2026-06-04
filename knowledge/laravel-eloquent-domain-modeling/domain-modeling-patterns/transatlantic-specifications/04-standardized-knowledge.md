# Transatlantic Specifications — Standardized Knowledge

## Overview

The specification pattern encapsulates business rules into reusable specification objects that can be combined (AND, OR, NOT) and evaluated both as database queries and in-memory checks. This enables consistent rule application across queries, validation, and domain logic without duplicating the rule logic.

## Key Concepts

- **Specification interface** — defines `applyToQuery()` and `isSatisfiedBy()` methods
- **Single rule per specification** — each specification encapsulates one business rule
- **Composable operators** — `AndSpecification`, `OrSpecification`, `NotSpecification` combine rules
- **Dual evaluation** — the same specification works for database filtering and in-memory validation
- **Query scope alternative** — specifications replace local scopes when composition or dual evaluation is needed

## Implementation Details

```php
interface Specification
{
    public function applyToQuery(Builder $query): Builder;
    public function isSatisfiedBy(Model $model): bool;
}

class CustomerIsVipSpecification implements Specification
{
    public function applyToQuery(Builder $query): Builder
    {
        return $query->where('total_purchases', '>', 10000)
                     ->where('account_age_months', '>', 12);
    }

    public function isSatisfiedBy(Model $model): bool
    {
        return $model->total_purchases > 10000
            && $model->account_age_months > 12;
    }
}

class AndSpecification implements Specification
{
    public function __construct(
        private readonly Specification $left,
        private readonly Specification $right,
    ) {}
}
```

## Best Practices

- Each specification encapsulates exactly one business rule
- Support both query and in-memory evaluation for dual-use rules
- Make specifications composable with AND, OR, NOT operators
- Use specifications where the same rule repeats across query, validation, and domain contexts
- Test both `applyToQuery()` and `isSatisfiedBy()` for each specification
