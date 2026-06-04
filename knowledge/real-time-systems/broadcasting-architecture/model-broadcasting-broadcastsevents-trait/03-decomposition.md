# Decomposition: Model Broadcasting Broadcastsevents Trait

## Topic Overview
Model broadcasting is a convention-over-configuration pattern in Laravel that automatically broadcasts Eloquent model state changes (created, updated, deleted, trashed, restored) to frontend clients. By adding the `BroadcastsEvents` trait to a model and defining a `broadcastOn()` method, Laravel automatically generates broadcast events when model instances change. The broadcast event name follows the convention `{ModelClass}.{event}` (e.g., `Order.created`), and the payload includes the model...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
event-broadcasting-architecture/K30-model-broadcasting-broadcastsevents-trait/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Model Broadcasting Broadcastsevents Trait
- **Purpose:** Model broadcasting is a convention-over-configuration pattern in Laravel that automatically broadcasts Eloquent model state changes (created, updated, deleted, trashed, restored) to frontend clients. By adding the `BroadcastsEvents` trait to a model and defining a `broadcastOn()` method, Laravel automatically generates broadcast events when model instances change. The broadcast event name follows the convention `{ModelClass}.{event}` (e.g., `Order.created`), and the payload includes the model...
- **Difficulty:** Intermediate
- **Dependencies:
  - K01: Laravel Broadcasting Architecture
  - K02: ShouldBroadcast Interface & Event Lifecycle
  - K11: Public/Private/Presence Channel Patterns
  - K12: Channel Authorization (routes/channels.php)

## Dependency Graph
**Depends on:**
  - K01: Laravel Broadcasting Architecture
  - K02: ShouldBroadcast Interface & Event Lifecycle
  - K11: Public/Private/Presence Channel Patterns
  - K12: Channel Authorization (routes/channels.php)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Convention over configuration**: Defaults to private channel with model class+ID naming, no manual event classes**Per-event customization**: `broadcastAs($event)` and `broadcastWith($event)` provide event-type-specific overrides**Auto-private channels**: Returning Eloquent models from `broadcastOn()` auto-creates private channels**Selective broadcasting**: `broadcastOn()` can return empty array to skip broadcasting for specific event types**No separate event files**: Reduces boilerplate for simple CRUD broadcasting scenarios**Private by default**: Model channels default to private, requiring authorization**Event-parameterized methods**: `broadcastOn($event)` receives the event type, enabling conditional channel selection**Less explicit than manual events**: The auto-generated event structure is fixed, limiting complex broadcast logic**No per-instance filtering**: `broadcastWhen()` is not available in the trait interface; use model events for conditional logic**Payload is model-sourced**: Cannot include external context (e.g., who performed the update) without overriding `broadcastWith()`**Model mutates during broadcast**: Serializing models at the event firing time may capture inconsistent state during transactionsModel broadcasting adds overhead to every Eloquent CRUD operation on the modelUse `broadcastOn()` to selectively broadcast only specific event types (e.g., only `updated`, not `created`)Heavy models with many attributes should override `broadcastWith()` to send minimal payloadsQueue-backed automatically (like all broadcasting), so the HTTP response is not blockedDefine channel authorization in `routes/channels.php` for auto-generated private channel namesEnsure model instances returned from `broadcastOn()` do not include loaded relationships unless explicitly neededTest that model serialization during broadcast does not cause N+1 queries in the queue workerBe aware that model broadcasting fires during bulk operations (`Model::update()`) which may generate unexpected broadcastsForgetting to define `broadcastOn()` on the model, causing no channels to be subscribedReturning the model instance from `broadcastOn()` expecting a public channel (it creates a private channel)Broadcasting on every event type when only specific events are neededAssuming model broadcasting works with `ShouldBroadcastNow` (it uses the standard queue by default)**Massive broadcast storm**: Updating thousands of models triggers thousands of broadcast events**Authorization failure**: Auto-generated private channel names don't match auth callback patterns**Stale data**: Model broadcasting within uncommitted transactions delivers incomplete data to clients**Missing context**: Frontend receives the model state but not the reason or actor behind the changeUsed for real-time dashboards showing latest orders, users, or inventory changesCommon in admin panels for live-updating tables without manual Event classesUseful for activity feeds and audit trail visualizationCan be combined with Laravel notifications for dual deliveryK01: Laravel Broadcasting ArchitectureK02: ShouldBroadcast Interface & Event LifecycleK11: Public/Private/Presence Channel PatternsK12: Channel Authorization (routes/channels.php)

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization