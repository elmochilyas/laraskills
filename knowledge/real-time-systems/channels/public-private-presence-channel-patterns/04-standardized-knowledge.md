# Standardized Knowledge: Public/Private/Presence Channel Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | Channel Types & Authorization |
| Knowledge Unit ID | K11 |
| Knowledge Unit | Public/Private/Presence Channel Patterns |
| Difficulty | Foundation |
| Maturity | Stable |
| Confidence | High |
| Last Updated | 2026-06-02 |

## Overview

Laravel broadcasting defines three channel types with escalating access control: public (any connected client can subscribe), private (authenticated and authorized users only), and presence (extends private with per-user online awareness). Public channels use the `Channel` class and require no authorization. Private channels use the `PrivateChannel` class and require a matching authorization callback in `routes/channels.php`. Presence channels use the `PresenceChannel` class and additionally track connected users, exposing `here`, `joining`, and `leaving` events to all channel members. Channel names are arbitrary strings; by convention, private channels are prefixed with `private-` and presence channels with `presence-`. All channel instances are created in the event's `broadcastOn()` method.

## Core Concepts

Channel type selection follows the principle of least privilege: use public channels only for information that should be visible to everyone. Private channels add a server-side authorization check before allowing subscription. Presence channels add the social layer—who else is currently connected and listening. The `Broadcast::channel()` method in `routes/channels.php` registers authorization callbacks for private and presence channels, receiving the authenticated user and channel parameters.

When Echo subscribes to a public channel, the WebSocket server immediately subscribes the connection. For private channels, Echo sends an HTTP POST to `/broadcasting/auth` with the channel name. Laravel invokes the matching callback; if truthy, the endpoint returns an auth signature validated by the WebSocket server. Presence channels follow the same auth flow but the callback must return an array of user data.

## When To Use

- Use **public** channels for information visible to everyone (announcements, public dashboards, sports scores)
- Use **private** channels for user-specific data (notifications, order updates, personal dashboards)
- Use **presence** channels for social features (chat rooms, collaborative editing, shared workspaces)
- Apply least privilege: start with private, downgrade to public only when no authorization is needed

## When NOT To Use

- Do not use public channels for any user-specific or sensitive data
- Do not use presence channels when private channels with a separate online-status API would suffice
- Do not use presence channels at extreme scale (10k+ members per channel) without careful capacity planning
- Do not use private channels when authorization logic is trivial or non-existent

## Best Practices (WHY)

- **Principle of least privilege**: Choosing the most restrictive channel type that meets requirements minimizes data exposure risk
- **Conventional naming**: Use patterns like `orders.{orderId}`, `App.Models.User.{id}`, `chat.{roomId}` for predictable channel organization
- **Parameterized channel names**: Use `{id}` or `{slug}` placeholders in `Broadcast::channel()` callbacks for pattern matching
- **Minimal presence data**: Return only required user data from presence auth callbacks to limit PII exposure

## Architecture Guidelines

- Channel authorization happens at subscription time, not per-event—design for subscription-time validation
- Presence data returned from the auth callback determines what user data is visible to other members
- The server validates auth signatures created by the Laravel application—WebSocket server trusts Laravel's auth
- Use channel name prefixes (`private-`, `presence-`) as enforced by the Pusher protocol

## Performance Considerations

- Public channels have zero auth overhead (fastest subscription path)
- Private channels add one HTTP round-trip per subscription (auth endpoint latency)
- Presence channels add auth + membership tracking overhead (Redis writes, event broadcasts)
- At scale, presence channels should be used sparingly; consider private channels with a separate "get online users" endpoint
- Membership state for presence channels is stored in Redis; large channels with frequent joins/leaves increase write pressure

## Security Considerations

- Broadcasting sensitive user data on public channels exposes it to any connected client
- Auth callback exceptions prevent all subscriptions to that channel
- Presence channel user data is visible to all members—never return sensitive fields
- Auth signatures can be replayed if no expiry mechanism is implemented
- Channel name collisions can cause authorization bypass if patterns overlap

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Broadcasting sensitive data on public channels | Assuming public channels are scoped to the current page | Any connected client receives sensitive data | Always use private/presence channels for user-specific data |
| Returning entire User model from presence auth callbacks | Convenience/over-serialization | Exposes PII (email, phone) to all channel members | Return only id, name, and avatar URL |
| Ignoring that presence `here` event excludes the joining user | Misunderstanding protocol semantics | New members don't see themselves in the member list | Initialize local state from auth callback response, not `here` event |
| Using presence channels when private + status API suffices | Social feature over-engineering | Unnecessary overhead from join/leave events and Redis writes | Benchmark both approaches before committing to presence |
| Not parameterizing channel names | Hardcoding channel identifiers | Unmanageable channel proliferation | Always use `{param}` placeholders for dynamic channel names |

## Anti-Patterns

- **Public channel for everything**: Makes authentication pointless and exposes all data
- **Presence channel as a general-purpose online tracker**: Broadcasts join/leave events for every channel change, even when presence awareness is not needed
- **Flat channel namespace**: Using generic names like `chat1`, `chat2` without structured naming leads to collisions and maintenance issues

## Examples

```php
// Event broadcasting on different channel types
public function broadcastOn()
{
    return [
        new Channel('public.updates'),                    // Public
        new PrivateChannel('orders.'.$this->order->id),   // Private
        new PresenceChannel('chat.'.$this->room->id),     // Presence
    ];
}
```

```javascript
// Echo subscription patterns
Echo.channel('public.updates')
    .listen('UpdateAvailable', (e) => { /* ... */ });

Echo.private('orders.' + orderId)
    .listen('OrderShipped', (e) => { /* ... */ });

Echo.join('chat.' + roomId)
    .here((users) => { /* ... */ })
    .joining((user) => { /* ... */ })
    .leaving((user) => { /* ... */ });
```

## Related Topics

- K12: Channel Authorization (routes/channels.php)
- K13: Presence Channels & Online User Tracking
- K29: Private Channel Auth with JWT/Sanctum
- K01: Laravel Broadcasting Architecture
- K31: Client Events (Whisper, Typing Indicators)

## AI Agent Notes

- Channel type selection is a security-first decision, not a performance decision
- The channel type is determined in the event class's `broadcastOn()` method, not in client code
- Echo's `.listen()` works identically across all channel types; only subscription differs
- Presence channel member data format is enforced at the protocol level (requires `id` field)

## Verification

- [ ] Public channels accessible without authentication to any WebSocket client
- [ ] Private channels return 403 for unauthorized users
- [ ] Presence channels return member list on join and broadcast join/leave events
- [ ] Auth callback returns correct truthy/falsy values for authorization scenarios
- [ ] Presence auth callback returns array with at minimum `id` and `name` fields
- [ ] Channel name prefixes (`private-`, `presence-`) are correctly applied
