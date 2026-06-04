# Standardized Knowledge: Presence Channels & Online User Tracking

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | Channel Types & Authorization |
| Knowledge Unit ID | K13 |
| Knowledge Unit | Presence Channels & Online User Tracking |
| Difficulty | Intermediate |
| Maturity | Stable |
| Confidence | High |
| Last Updated | 2026-06-02 |

## Overview

Presence channels extend private channels with real-time online user awareness. When a user subscribes to a presence channel, all other subscribers receive a `joining` event; when they leave, a `leaving` event fires; and new subscribers immediately receive a `here` event with the current member list. The presence channel authorization callback must return an array of user data (with at least `id` and `name` fields). Laravel stores presence membership state in Redis (for Reverb) or the configured scaling backend. Echo provides the `join()` method for presence subscriptions and the `here()`, `joining()`, and `leaving()` event listeners.

## Core Concepts

A presence channel is a private channel with attached membership tracking. Every subscriber is a "member" with associated user data. When a member subscribes, all existing members are notified. When they unsubscribe, remaining members are notified. New subscribers receive the full current member list.

When Echo calls `join('presence-chat.1')`, it POSTs to `/broadcasting/auth` with the `presence-` prefixed channel name. The auth callback receives `$user` and returns user data array. The WebSocket server adds the user to its membership list, stores it in Redis, and broadcasts `pusher_internal:member_added` to all subscribers (except the joiner). On unsubscribe, it broadcasts `pusher_internal:member_removed`.

## When To Use

- Chat applications needing "who's online" displays per room
- Collaborative editing showing active collaborators
- Online game lobbies and player presence
- Live dashboards showing active viewers
- Social features ("X other people are viewing this product")

## When NOT To Use

- Simple online/offline status tracking (use private channels + a status API)
- Very large channels (10k+ members) where join/leave event fan-out becomes expensive
- Applications where member data privacy is critical (all members see each other's data)
- Use cases that only need real-time events, not user awareness

## Best Practices (WHY)

- **Minimal user data**: Return only `id`, `name`, `avatar_url` from auth callbacks—never email, phone, or sensitive fields
- **Ghost member cleanup**: Set Redis TTL on presence state keys and configure pulse/prune for stale connection cleanup
- **Monitor member counts**: Track presence channel size to detect abnormal patterns or ghost accumulation
- **Test with realistic churn**: Presence behavior differs dramatically at 10 vs 10,000 simultaneous join/leaves

## Architecture Guidelines

- Membership state lives in Redis for cross-instance visibility and crash recovery
- Auth callback is the single source of truth for user data shared with members
- Pusher protocol uses internal events (prefix `pusher_internal:`) for join/leave—not visible to application code
- `here` event fires once per subscription to the joining client only, containing the serialized member list
- Reverb stores presence membership under keys following `reverb:presence:{channelName}:members`

## Performance Considerations

- Join/leave event fan-out is O(n) per event for n channel members
- `here` event payload size scales linearly with member count
- Redis writes on every join/leave; at high churn rates this becomes write-intensive
- Presence channel auth callbacks execute on every subscription; optimize for speed
- Ghost member cleanup (pulse/prune) adds periodic database/Redis load

## Security Considerations

- All members see other members' returned user data—never include sensitive information
- Auth callback controls what data is shared; design it with minimal exposure in mind
- Joining user does not receive their own `here` event—only existing member list
- Abrupt disconnections leave ghost members until timeout-based cleanup runs

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Returning entire User model | Convenience | PII exposed to all channel members | Return only id, name, avatar URL |
| No ghost member cleanup | Assuming clean disconnects always happen | Inflated member counts over time | Configure TTL and pulse/prune |
| Ignoring `here` event | Only listening for `joining`/`leaving` | New subscribers miss current state | Always handle `here` for initial state |
| Using `join()` without auth | Assuming presence channels work like public | Subscription fails silently | Ensure auth callback is registered |
| Expecting `here` for own join | Misunderstanding protocol | Missing self in member list | Initialize from auth callback response |

## Anti-Patterns

- **Presence as general online tracker**: Broadcasting join/leave for every presence channel when only global online status is needed
- **Over-fetching presence data**: Returning full user profiles with every join/leave event
- **No TTL on presence keys**: Redis memory grows unbounded with stale members

## Examples

```php
// Presence channel auth callback
Broadcast::channel('chat.{roomId}', function ($user, $roomId) {
    if ($user->canJoin($roomId)) {
        return ['id' => $user->id, 'name' => $user->name, 'avatar' => $user->avatar_url];
    }
});
```

```javascript
// Echo presence channel subscription
const presence = Echo.join('chat.' + roomId);

presence.here((users) => {
    this.users = users;
});

presence.joining((user) => {
    this.users.push(user);
});

presence.leaving((user) => {
    this.users = this.users.filter(u => u.id !== user.id);
});
```

## Related Topics

- K11: Public/Private/Presence Channel Patterns
- K12: Channel Authorization (routes/channels.php)
- K35: Ghost Member Cleanup in Presence Channels
- K34: Redis Dependency & Failure Modes

## AI Agent Notes

- Presence channel auth callbacks MUST return an array, not just true/false
- The `here` event only fires for the joining client and contains the current member list
- `joining` and `leaving` events fire for all OTHER members, not the subject
- Ghost member cleanup is necessary for production reliability

## Verification

- [ ] Presence auth callback returns array with at least `id` field
- [ ] `here` event contains current member list on join
- [ ] `joining` event fires for other members when a user subscribes
- [ ] `leaving` event fires for other members when a user unsubscribes
- [ ] Ghost members are cleaned up within acceptable timeframe
- [ ] Redis presence state keys have TTL configured
- [ ] No sensitive PII is exposed in presence user data
