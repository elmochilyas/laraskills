# Model Broadcasting — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Model Broadcasting |
| Focus | Anti-patterns in BroadcastsEvents trait, broadcast payloads, and channel configuration |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Using `BroadcastsEvents` Instead of `BroadcastsEventsAfterCommit` | Reliability | High |
| 2 | Not Overriding `broadcastWith()` — All Attributes Exposed | Security | Critical |
| 3 | Public Channels for Sensitive Model Data | Security | High |
| 4 | Generic Event Names Coupling Frontend to Eloquent | Maintainability | Medium |
| 5 | Manual Broadcast Calls Duplicating Auto-Broadcasts | Reliability | Medium |
| 6 | Eager-Loaded Relations in Broadcast Payloads | Security | High |

## Repository-Wide Cross-Cutting Patterns

- The most critical security anti-pattern is not overriding `broadcastWith()`, which sends all model attributes including sensitive fields to unauthorized clients
- Using `BroadcastsEvents` instead of the after-commit variant broadcasts stale data when the wrapping transaction rolls back
- Public channels for user-specific models expose data to any authenticated client

---

## 1. Using `BroadcastsEvents` Instead of `BroadcastsEventsAfterCommit`

### Category
Reliability

### Description
Adding the `BroadcastsEvents` trait (which broadcasts before the transaction commits) instead of `BroadcastsEventsAfterCommit` (which broadcasts only after a successful commit), risking stale data broadcasts on rolled-back transactions.

### Why It Happens
`BroadcastsEvents` is the simpler name and may be the first one discovered. Developers may not be aware that a transaction-wrapping operation can roll back after the broadcast fires.

### Warning Signs
- `use BroadcastsEvents` on any model
- Clients receive model updates for data that never persisted
- UI shows records that don't exist in the database after a failed operation
- Comments like "we sometimes see phantom records"

### Why Harmful
- Clients see state from rolled-back transactions, causing confusion and data inconsistency
- Automated UI logic triggered by the broadcast acts on non-existent data
- Debugging phantom client state is time-consuming because the root cause is timing-dependent

### Preferred Alternative
```php
use Illuminate\Database\Eloquent\BroadcastsEventsAfterCommit;

class Order extends Model
{
    use BroadcastsEventsAfterCommit;
}
```

### Detection Checklist
- [ ] Search for `use BroadcastsEvents` (without AfterCommit)
- [ ] Replace with `BroadcastsEventsAfterCommit`
- [ ] Verify broadcasts only fire after successful transactions

### Related
| Rule | `05-rules.md` — Always Prefer `BroadcastsEventsAfterCommit` Over `BroadcastsEvents` |
| Decision Tree | `07-decision-trees.md` — BroadcastsEvents vs BroadcastsEventsAfterCommit |

---

## 2. Not Overriding `broadcastWith()` — All Attributes Exposed

### Category
Security

### Description
Using the default `broadcastWith()` behavior, which serializes all model attributes to JSON and sends them to the client, potentially exposing passwords, tokens, PII, and internal state.

### Why It Happens
The default behavior "just works" — developers see data appearing on the frontend and don't realize that everything, including sensitive fields, is being broadcast.

### Warning Signs
- No `broadcastWith()` override on the model
- Default broadcast payload includes `password`, `remember_token`, `api_token`, or other sensitive fields
- Broadcast payload size is larger than necessary — includes all model columns
- Comments like "we need to filter broadcast data" without implementation

### Why Harmful
- Passwords, tokens, and PII are sent to every client subscribed to the channel
- Compliance violations (GDPR, HIPAA, PCI-DSS) for leaking sensitive data
- Attackers can intercept broadcast data to harvest credentials

### Preferred Alternative
```php
public function broadcastWith(): array
{
    return [
        'id' => $this->id,
        'status' => $this->status,
        'total' => $this->total_cents,
    ];
}
```

### Detection Checklist
- [ ] Search for models using `BroadcastsEvents` without `broadcastWith()` override
- [ ] Check default broadcast payload for sensitive fields
- [ ] Add explicit allow-list in `broadcastWith()` for all broadcasting models

### Related
| Rule | `05-rules.md` — Always Override `broadcastWith()` to Filter Sensitive Data |
| Decision Tree | `07-decision-trees.md` — Broadcast Data Customization |

---

## 3. Public Channels for Sensitive Model Data

### Category
Security

### Description
Using public broadcast channels (the default) for models containing user-specific or sensitive data, allowing any authenticated client to subscribe and receive updates.

### Why It Happens
The default channel resolution creates a public channel (`App.Models.Order.42`). Developers don't override `broadcastOn()` and don't realize the channel's scope.

### Warning Signs
- No `broadcastOn()` override on the model
- Default `App.Models.{Model}.{Id}` channel pattern for user-specific models
- Any authenticated user can subscribe to channel and receive all model broadcasts
- Comments like "broadcasts are public" without justification

### Preferred Alternative
```php
public function broadcastOn(): array
{
    return [new PrivateChannel('orders.'.$this->user_id)];
}
```

### Detection Checklist
- [ ] Review each broadcasting model's channel privacy level
- [ ] Replace public channels with `PrivateChannel` for user-specific data
- [ ] Verify channel authentication is configured for private channels

### Related
| Rule | `05-rules.md` — Use Private Channels for Sensitive Models |
| Decision Tree | `07-decision-trees.md` — Channel Privacy Level |

---

## 4. Generic Event Names Coupling Frontend to Eloquent

### Category
Maintainability

### Description
Relying on default broadcast event names (`eloquent.created`, `eloquent.updated`, `eloquent.deleted`) instead of overriding `broadcastAs()` to provide semantic domain-specific event names.

### Why It Happens
The default names work and developers don't consider that they couple the frontend to Eloquent's internal naming convention.

### Warning Signs
- Frontend listens to `eloquent.created`, `eloquent.updated`, `eloquent.deleted`
- No `broadcastAs()` override on broadcasting models
- Renaming the model class would break frontend event listeners
- Comments like "frontend uses Eloquent event names"

### Preferred Alternative
```php
public function broadcastAs(): string
{
    return 'order.placed';
}
```

### Detection Checklist
- [ ] Check if frontend uses `eloquent.*` event names
- [ ] Add `broadcastAs()` override with semantic names
- [ ] Update frontend listeners to use the new semantic names

### Related
| Rule | `05-rules.md` — Override `broadcastAs()` for Semantic Event Names |

---

## 5. Manual Broadcast Calls Duplicating Auto-Broadcasts

### Category
Reliability

### Description
Calling `$model->broadcastUpdated()`, `broadcastCreated()`, or `broadcastDeleted()` manually after the model is saved, duplicating the broadcast that the trait already fires automatically.

### Why It Happens
Developers call the manual broadcast method "just to be safe" without realizing the trait already handles it. The duplicate broadcast creates double messages on the client.

### Warning Signs
- `$model->save()` followed by `$model->broadcastUpdated()`
- Clients receive duplicate updates for a single save operation
- Duplicate notifications in real-time UI
- Comments like "force broadcast" or "ensure broadcast"

### Preferred Alternative
```php
$order->save(); // Single broadcast fires automatically
```

### Detection Checklist
- [ ] Search for `broadcastUpdated()`, `broadcastCreated()`, `broadcastDeleted()` calls
- [ ] Remove manual calls that follow `save()` or `delete()`
- [ ] Verify clients receive exactly one broadcast per operation

### Related
| Rule | `05-rules.md` — Use `broadcastUpdated()` Only When the Broadcast Trait Is Insufficient |

---

## 6. Eager-Loaded Relations in Broadcast Payloads

### Category
Security

### Description
Including eager-loaded relationships in `broadcastWith()` output (e.g., `$this->load('user')->toArray()`), exposing related model attributes without explicit allow-listing.

### Why It Happens
Developers call `toArray()` on the model for convenience, which includes all attributes of the model and its loaded relationships, without auditing what data is exposed.

### Warning Signs
- `broadcastWith()` calls `$this->load(...)->toArray()`
- Related model attributes (email, address, phone) appear in broadcast payload
- No explicit field-level filtering for related data
- Comments like "we include the user relation" without payload review

### Preferred Alternative
```php
public function broadcastWith(): array
{
    return [
        'id' => $this->id,
        'user_name' => $this->user->name, // Only the field we need
    ];
}
```

### Detection Checklist
- [ ] Search for `toArray()`, `load(`, `->load` in `broadcastWith()` methods
- [ ] Review broadcast payloads for unexpected relation data
- [ ] Replace with explicit field-level allow-lists

### Related
| Rule | `05-rules.md` — Do Not Broadcast Sensitive Model Relations by Default |
| Skill | `06-skills.md` — Set Up Model Broadcasting with BroadcastsEventsAfterCommit |
