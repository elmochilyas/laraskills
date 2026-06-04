# Skill: Use Model Broadcasting with the BroadcastsEvents Trait

## Purpose
Automatically broadcast Eloquent model state changes to frontend clients using the `BroadcastsEvents` trait, eliminating manual event classes for simple CRUD broadcasting.

## When To Use
- Real-time dashboards showing latest model changes (orders, users, inventory)
- Admin panels with live-updating tables
- Activity feeds and audit trail visualization
- Simple CRUD broadcasting without complex event logic

## When NOT To Use
- Complex broadcast logic requiring conditional payloads or external context
- High-frequency model updates that would trigger broadcast storms
- Broadcasting within bulk data operations (migrations, seeding)

## Prerequisites
- Laravel broadcasting configured (queue worker, broadcast driver)
- Model with Eloquent events (created, updated, deleted, trashed, restored)
- Frontend Echo configured to listen for model broadcasts

## Inputs
- Eloquent Model class
- `BroadcastsEvents` trait
- `broadcastOn()` method returning channel instances
- Optional: `broadcastWith()`, `broadcastAs()`, `broadcastOn()` event filtering

## Workflow
1. Add `use Illuminate\Database\Eloquent\BroadcastsEvents;` to the model
2. Implement `broadcastOn(string $event): array` returning channels
3. Filter event types: return empty array for events that shouldn't broadcast
4. Override `broadcastWith(string $event)` to control payload (avoid sending entire model)
5. Override `broadcastAs(string $event)` for stable client-side event names
6. Register auth callbacks in `routes/channels.php` for auto-generated private channels
7. On frontend, use `useEchoModel()` (framework hooks) or listen on the channel manually
8. Test: create, update, and delete a model instance and verify events arrive client-side

## Validation Checklist
- [ ] Model uses `BroadcastsEvents` trait
- [ ] `broadcastOn()` is defined and returns appropriate channel instances
- [ ] Event types are filtered (not broadcasting all CRUD operations indiscriminately)
- [ ] `broadcastWith()` returns a minimal payload (not the entire model)
- [ ] Auth callback registered for auto-generated `App.Models.{ModelName}.{id}` pattern
- [ ] Model broadcasting is suppressed during bulk operations via `Model::withoutEvents()`

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| No broadcasts emitted | `broadcastOn()` missing or returns empty array | Check model has `broadcastOn()` defined |
| Subscriptions fail (403) | No auth callback for auto-generated private channel | Register `App.Models.User.{id}` pattern in channels.php |
| Entire model sent to clients | `broadcastWith()` not overridden | Define `broadcastWith()` to select specific fields |
| Broadcast storm on bulk update | `Model::update()` fires events per row | Wrap in `Model::withoutEvents()` |

## Decision Points
- **Returning model instance** from `broadcastOn()` auto-creates a PrivateChannel, not public
- **Filter by event type**: return `[]` in `broadcastOn()` for events that shouldn't broadcast
- **Manual events vs model broadcasting**: Use manual `ShouldBroadcast` events when external context (who, why) is needed

## Performance/Security Considerations
- Model broadcasting fires on every Eloquent CRUD operation by default—filter aggressively
- Heavy models with many attributes should override `broadcastWith()` to send minimal payloads
- Use `Model::withoutEvents()` for bulk operations to prevent broadcast storms
- Returning `$this` from `broadcastOn()` creates a private channel—not public

## Related Rules (from 05-rules.md)
- Always Define `broadcastOn()` When Using the `BroadcastsEvents` Trait
- Always Filter Event Types in `broadcastOn()` to Avoid Unnecessary Broadcasts
- Always Register Auth Callbacks for Auto-Generated Private Channels
- Always Override `broadcastWith()` on Heavy Models
- Avoid Model Broadcasting During Bulk Data Operations

## Related Skills
- Configure and Operate Laravel Broadcasting Architecture
- Create and Customize ShouldBroadcast Events

## Success Criteria
- Model CRUD operations trigger real-time updates on frontend
- Only specified event types trigger broadcasts
- Payload contains only intended fields (no sensitive data)
- Bulk operations don't cause broadcast storms
