# Event Dispatch Order (Reference)

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Event Dispatch Order (Reference) |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Comprehensive reference for Eloquent model event dispatch sequences across all lifecycle operations. Use this as a quick reference when writing event listeners that depend on execution order.

## Dispatch Sequences

### Create
```
saving → creating → INSERT → created → saved
```

### Update
```
saving → updating → UPDATE → updated → saved
```

### Delete (Hard)
```
deleting → DELETE → deleted
```

### Soft Delete
```
deleting → trashing → UPDATE deleted_at → trashed → deleted
```

### Restore
```
restoring → UPDATE deleted_at = NULL → restored
```

### Force Delete
```
forceDeleting → DELETE → forceDeleted
```

### Retrieve
```
retrieving → SELECT → retrieved
```

### Boot (Class Initialization)
```
booting → trait boot*() methods → booted
```

### Replicate
```
replicating → attribute copy
```

### BelongsToMany Pivot Attach
```
pivotAttaching → INSERT pivot → pivotAttached
```

### BelongsToMany Pivot Detach
```
pivotDetaching → DELETE pivot → pivotDetached
```

### BelongsToMany Pivot Update
```
pivotUpdating → UPDATE pivot → pivotUpdated
```

## Key Rules

1. **Nesting**: `saving`/`saved` wraps `creating`/`created` or `updating`/`updated`
2. **Halting**: Only `*ing` events can halt by returning `false`
3. **Uniqueness**: `saving`/`saved` fire once per `save()` call regardless of insert vs update
4. **Conditional `creating`/`updating`**: These only fire if the operation is an insert or update respectively
5. **Pivot independence**: Pivot events fire outside the main model event chain

## Verification

- [ ] `saving` listeners handle both create and update scenarios
- [ ] `creating` and `updating` are checked with `wasRecentlyCreated` or `isDirty()` in `saved`
- [ ] Pivot events are handled separately from model events
