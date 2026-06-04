# Metadata
Domain: Real-Time Systems
Subdomain: Channel Types & Authorization
Knowledge Unit: Public/Private/Presence Channel Patterns
Difficulty Level: Foundation
Last Updated: 2026-06-02

## Executive Summary
Laravel broadcasting defines three channel types with escalating access control: public (any connected client can subscribe), private (authenticated and authorized users only), and presence (extends private with per-user online awareness). Public channels use the `Channel` class and require no authorization. Private channels use the `PrivateChannel` class and require a matching authorization callback in `routes/channels.php`. Presence channels use the `PresenceChannel` class and additionally track connected users, exposing `here`, `joining`, and `leaving` events to all channel members. Channel names are arbitrary strings; by convention, private channels are prefixed with `private-` and presence channels with `presence-`. All channel instances are created in the event's `broadcastOn()` method.

## Core Concepts
Channel type selection follows the principle of least privilege: use public channels only for information that should be visible to everyone (e.g., public announcement feeds). Private channels add a server-side authorization check before allowing subscription. Presence channels add the social layer—who else is currently connected and listening. The `Broadcast::channel()` method in `routes/channels.php` registers authorization callbacks for private and presence channels, receiving the authenticated user and channel parameters.

## Mental Models
- **Public**: A public bulletin board—anyone can read it.
- **Private**: Your personal inbox—you must prove identity and authorization to access.
- **Presence**: A meeting room with a nametag display—you get access after authorization, and you can see who else is in the room.

## Internal Mechanics
When Echo subscribes to a public channel (via `channel()`), the WebSocket server immediately subscribes the connection. For private channels (via `private()`), Echo sends an HTTP POST to `/broadcasting/auth` with the channel name. Laravel's `BroadcastController` invokes the matching callback from `routes/channels.php`. If the callback returns truthy, the endpoint returns an auth signature that Echo sends to the WebSocket server for validation. Presence channels follow the same auth flow but the callback must return an array of user data (at minimum an `id` and `name`). The WebSocket server tracks connected users per channel and broadcasts join/leave events.

## Patterns
- **Least privilege by channel type**: Start with private; downgrade to public only when no authorization needed
- **Parameterized channel names**: Use `{id}` or `{slug}` placeholders in `Broadcast::channel()` callbacks
- **Presence for social features**: Chat rooms, collaborative editing, shared dashboards
- **Conventional naming**: `orders.{orderId}`, `App.Models.User.{id}`, `chat.{roomId}`

## Architectural Decisions
- **Channel authorization at subscription time**: Unlike coarse API-level auth, channel auth is granular per-channel
- **Presence data returned from auth callback**: The callback determines what user data is visible to other members
- **Server validates auth signatures**: The WebSocket server verifies auth tokens created by the Laravel application

## Tradeoffs
- **Public channels provide no access control**: Any connected client (even unauthenticated) can subscribe and receive events
- **Presence channels increase overhead**: Each join/leave event generates a broadcast to all channel members plus Redis writes
- **Presence scale cost**: At thousands of users on a single channel, join/leave events create significant traffic
- **Auth endpoint latency**: Private channel subscription requires an HTTP request before subscription completes

## Performance Considerations
- Public channels have zero auth overhead (fastest subscription)
- Private channels add one HTTP round-trip per subscription (auth endpoint latency)
- Presence channels add auth + membership tracking overhead (Redis writes, event broadcasts)
- At scale, presence channels should be used sparingly; consider private channels with separate online status endpoints
- Membership state for presence channels is stored in Redis; large channels with frequent joins/leaves increase write pressure

## Production Considerations
- Always use private or presence channels for user-specific data
- Implement auth caching for frequently subscribed private channels to reduce auth endpoint load
- Monitor presence channel membership sizes and prune stale connections
- Use the `receivesBroadcastNotificationsOn` method on notifiable entities to customize notification channel names
- Test channel authorization with different user roles and permissions

## Common Mistakes
- Broadcasting sensitive user data on public channels (any connected client can receive it)
- Not using parameterized channel names, creating a separate channel per entity without structure
- Returning too much user data from presence channel auth callbacks (exposes PII to all members)
- Forgetting that presence channel members receive their own join event
- Using presence channels when private channels with a separate "get online users" API would suffice

## Failure Modes
- **Auth callback exception**: Unhandled exception in authorization callback prevents all subscriptions to that channel
- **Presence state corruption**: Redis data loss causes incorrect online user counts
- **Public channel data leak**: Sensitive event broadcast on public channel instead of private
- **Channel name collision**: Same channel name used for different purposes in different contexts
- **Auth signature replay**: Old auth signatures reused if no expiry mechanism

## Ecosystem Usage
- Public channels: live blog updates, public dashboards, sports scores, announcements
- Private channels: user-specific notifications, order updates, personal dashboards
- Presence channels: chat applications, collaborative editing, multiplayer features, shared workspaces
- Laravel Notifications automatically use private channels named `App.Models.User.{id}`

## Related Knowledge Units
- K12: Channel Authorization (routes/channels.php)
- K13: Presence Channels & Online User Tracking
- K29: Private Channel Auth with JWT/Sanctum
- K01: Laravel Broadcasting Architecture

## Research Notes
The channel type system has remained stable across Laravel versions. The `Channel`, `PrivateChannel`, and `PresenceChannel` classes are defined in `Illuminate/Broadcasting/`. Presence channel user data requirements (at minimum `id` and `name`) are enforced by the WebSocket server. Laravel 13 did not change the channel type system. The channel name prefix convention (`private-`, `presence-`) is enforced by the Pusher protocol and implemented by Reverb.
