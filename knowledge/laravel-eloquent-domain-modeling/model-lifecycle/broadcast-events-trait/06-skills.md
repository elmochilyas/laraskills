# Skill: Set Up Model Broadcasting with BroadcastsEventsAfterCommit

## Purpose

Add real-time broadcasting to an Eloquent model using `BroadcastsEventsAfterCommit`, automatically pushing create/update/delete events to WebSocket channels after the database transaction commits.

## When To Use

- Frontend needs real-time updates when model data changes
- Building live dashboards, notifications, or collaborative features
- Model state changes must be pushed to connected clients

## When NOT To Use

- The broadcast data is not needed on the frontend (use explicit WebSocket messages)
- The model contains sensitive data that cannot be filtered for broadcast
- The model updates at very high frequency (rate-limiting required)

## Prerequisites

- Laravel broadcasting configured (Pusher, Reverb, or other driver)
- WebSocket server running
- Frontend configured to listen on broadcasting channels

## Inputs

- Model class name
- Channel name pattern
- List of attributes to include in the broadcast payload
- Channel privacy level (public, private, presence)

## Workflow

1. Add the `BroadcastsEventsAfterCommit` trait to the model:
   ```
   use Illuminate\Database\Eloquent\BroadcastsEventsAfterCommit
   
   class Order extends Model
   {
       use BroadcastsEventsAfterCommit
   }
   ```
2. Override `broadcastOn()` to define the broadcast channel:
   ```
   public function broadcastOn(): array
   {
       return [new PrivateChannel('orders.'.$this->id)]
   }
   ```
3. Override `broadcastWith()` to create an explicit allow-list of broadcast data:
   ```
   public function broadcastWith(): array
   {
       return [
           'id' => $this->id,
           'status' => $this->status,
           'total' => $this->total_cents,
       ]
   }
   ```
4. Optionally override `broadcastAs()` for semantic event names:
   ```
   public function broadcastAs(): string
   {
       return 'order.placed'
   }
   ```
5. Place `BroadcastsEventsAfterCommit` last in the trait `use` statement, after domain traits
6. Write tests that assert the broadcast payload structure

## Validation Checklist

- [ ] `BroadcastsEventsAfterCommit` used, not `BroadcastsEvents`
- [ ] `broadcastWith()` overridden to filter sensitive data
- [ ] Broadcast channels use appropriate privacy (private for user-specific, public for general)
- [ ] `broadcastAs()` provides semantic event names for frontend
- [ ] No eager-loaded relations included in broadcast payload without explicit allow-listing
- [ ] Broadcast trait is listed after domain traits in the `use` statement
- [ ] Broadcast payload tests are written

## Common Failures

- **Sensitive data leak**: Default `broadcastWith()` serializes all attributes. Always override to create an explicit allow-list.
- **Public channel exposure**: Model data broadcast on public channels is accessible to all authenticated clients. Use `PrivateChannel` for user-specific data.
- **Pre-commit broadcast**: `BroadcastsEvents` fires before transaction commit. Use `BroadcastsEventsAfterCommit` to avoid broadcasting rolled-back data.
- **Duplicate manual broadcasts**: Calling `$model->broadcastUpdated()` after `$model->save()` creates duplicate broadcasts. The trait fires automatically on save.

## Decision Points

- **BroadcastsEventsAfterCommit vs BroadcastsEvents**: Always prefer "after commit" variant to prevent broadcasting stale/rolled-back data. Use `BroadcastsEvents` only when optimistic broadcast before commit is required.
- **Public vs Private channel**: Use `PrivateChannel` for user-specific or sensitive data. Use public channels only for genuinely public data (leaderboards, status boards).

## Performance Considerations

- Each broadcast triggers a network round-trip — batch or throttle for high-frequency updates
- `BroadcastsEventsAfterCommit` adds no overhead on rollback (broadcast is skipped)

## Security Considerations

- Always override `broadcastWith()` — never expose passwords, tokens, PII, or internal state
- Use `PrivateChannel` or `PresenceChannel` for user-specific data
- Rate-limit broadcasts to prevent abuse or overload

## Related Rules

- Rule 1: Always Prefer `BroadcastsEventsAfterCommit` Over `BroadcastsEvents`
- Rule 2: Always Override `broadcastWith()` to Filter Sensitive Data
- Rule 3: Use Private Channels for Sensitive Models
- Rule 4: Override `broadcastAs()` for Semantic Event Names
- Rule 9: Place `BroadcastsEventsAfterCommit` After Other Traits

## Related Skills

- Commit Strategies for Transactional Safety
- Event Control / Quiet Operations for Suppression
- Observer Pattern for Lifecycle Hooks

## Success Criteria

- Model broadcasts fire automatically after successful save/delete
- Broadcast payload contains only explicitly allowed attributes
- Private channels protect user-specific data
- Semantic event names decouple frontend from Eloquent internals
- No duplicate broadcasts from manual calls alongside the trait
