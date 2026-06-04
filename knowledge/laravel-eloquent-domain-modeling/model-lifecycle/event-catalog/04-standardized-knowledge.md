# Event Catalog

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Event Catalog |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Eloquent models fire 21+ lifecycle events covering creation, update, deletion, soft deletes, restoration, replication, retrieval, and booting. These events are dispatched through Laravel's event dispatcher and provide hooks for side effects, validation, and synchronization. Every event maps to a specific phase of the model's database interaction.

## Core Concepts

- **Before/After pairing**: `*ing` fires before the operation, `*ed` fires after
- **Halting**: Returning `false` from `*ing` events aborts the operation
- **Event payload**: Each event receives the model instance
- **Pivot events**: `pivotAttaching`, `pivotAttached`, `pivotDetaching`, `pivotDetached`, `pivotUpdating`, `pivotUpdated`

## Event List

| Event | Timing | Halts | Description |
|---|---|---|---|
| `retrieved` | After DB SELECT | No | Fired when a model is retrieved from the database |
| `creating` | Before INSERT | Yes | Fired when a new model is first saved |
| `created` | After INSERT | No | Fired after a new model is saved |
| `updating` | Before UPDATE | Yes | Fired when an existing model is saved with changes |
| `updated` | After UPDATE | No | Fired after an existing model is saved |
| `saving` | Before INSERT/UPDATE | Yes | Fired before both create and update |
| `saved` | After INSERT/UPDATE | No | Fired after both create and update |
| `deleting` | Before DELETE | Yes | Fired when a model is deleted |
| `deleted` | After DELETE | No | Fired after a model is deleted |
| `trashing` | Before soft delete UPDATE | Yes | Fired when `deleted_at` is set |
| `trashed` | After soft delete UPDATE | No | Fired after `deleted_at` is set |
| `restoring` | Before restore UPDATE | Yes | Fired when restoring a soft-deleted model |
| `restored` | After restore UPDATE | No | Fired after restoring |
| `forceDeleting` | Before force DELETE | Yes | Fired when force deleting a soft-deletable model |
| `forceDeleted` | After force DELETE | No | Fired after force deleting |
| `replicating` | Before model replicate | Yes | Fired when `replicate()` is called |
| `booting` | During class boot | No | Fired before trait boot methods |
| `booted` | After class boot | No | Fired after all boot methods complete |
| `retrieving` | Before DB SELECT | Yes | Fired before model hydration |

## When To Use Events

- Cache invalidation after save/delete
- Audit logging of model changes
- Sync with external systems
- Enforcing invariants before persistence

## When NOT To Use Events

- Business logic that should be explicit (use domain events)
- Operations that need to be queued (use jobs/dispatches)
- Cross-aggregate coordination (use action classes)

## Best Practices

- **Use `*ing` events for validation/authorization**: Prevent invalid saves by returning `false` from `saving`, `creating`, or `updating` listeners.
- **Use `*ed` events for side effects**: Cache invalidation, logging, and notifications belong in after-events since the operation has already succeeded.
- **Don't rely on `saved` vs `created`/`updated`**: `saved` fires for both inserts and updates. Use `created`/`updated` when the distinction matters.

## Examples

```php
class OrderObserver
{
    public function saving(Order $order): void
    {
        if ($order->total_cents < 0) {
            return false; // Abort save
        }
    }

    public function saved(Order $order): void
    {
        Cache::forget("order:{$order->id}");
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Base Model Class |
| Closely Related | Event Dispatch Order |
| Closely Related | Event Propagation |
| Closely Related | Observer Pattern |

## AI Agent Notes

- `*ing` events can halt the operation by returning `false`
- `*ed` events are for side effects only
- Use `created`/`updated` for insert/update distinction; `saved` for both

## Verification

- [ ] `*ing` events used for validation/authorization
- [ ] `*ed` events used for side effects
- [ ] Event handler return type considered (false = halt for `*ing`)
