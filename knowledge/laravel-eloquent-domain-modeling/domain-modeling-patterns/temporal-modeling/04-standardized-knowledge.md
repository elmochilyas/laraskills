# Temporal Modeling — Standardized Knowledge

## Overview

Temporal modeling tracks historical state changes of Eloquent models over time, enabling point-in-time queries and audit trails. Common approaches include Slowly Changing Dimension (SCD) Type 2 with `valid_from`/`valid_to` columns, event sourcing with an append-only event log, and snapshot versioning.

## Key Concepts

- **SCD Type 2** — duplicates rows with `valid_from`/`valid_to` columns for direct point-in-time querying
- **Event sourcing** — stores events, reconstructs state by replaying them
- **Snapshot versioning** — stores periodic full snapshots of model state
- **Point-in-time queries** — retrieve the state as it was at a specific moment
- **Current state view** — filter `WHERE valid_to IS NULL` for active records only
- **Temporal indexes** — index `valid_from` and `valid_to` for query performance

## Implementation Details

```php
class Contract extends Model
{
    public function createVersion(): void
    {
        $this->valid_to = now();
        $this->save();

        $next = $this->replicate(['valid_from', 'valid_to']);
        $next->valid_from = now();
        $next->valid_to = null;
        $next->save();
    }

    public function scopeAsOf(Builder $query, Carbon $pointInTime): void
    {
        $query->where('valid_from', '<=', $pointInTime)
              ->where(fn ($q) => $q->whereNull('valid_to')->orWhere('valid_to', '>', $pointInTime));
    }
}
```

## Best Practices

- Choose SCD Type 2 for direct SQL queryability (default)
- Choose event sourcing for full audit trailing with change reasons
- Intentionally version on meaningful state changes, not on every save
- Add `scopeAsOf()` for point-in-time querying
- Index temporal columns for performance on historical queries
