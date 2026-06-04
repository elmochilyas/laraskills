# Metadata
Domain: Real-Time Systems
Subdomain: Channel Types & Authorization
Knowledge Unit: Presence Channels & Online User Tracking
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Presence channels extend private channels with real-time online user awareness. When a user subscribes to a presence channel, all other subscribers receive a `joining` event; when they leave, a `leaving` event fires; and new subscribers immediately receive a `here` event with the current member list. The presence channel authorization callback must return an array of user data (with at least `id` and `name` fields). Laravel stores presence membership state in Redis (for Reverb) or the configured scaling backend. Echo provides the `join()` method for presence subscriptions and the `here()`, `joining()`, and `leaving()` event listeners.

## Core Concepts
A presence channel is a private channel with attached membership tracking. Every subscriber is a "member" with associated user data. When a member subscribes, all existing members are notified. When they unsubscribe, remaining members are notified. New subscribers receive the full current member list. This enables features like "X users are viewing this page" or "X is typing."

## Mental Models
A presence channel is a room with a live occupancy display. Everyone in the room can see who else is there. When someone enters, everyone sees them arrive. When they leave, everyone sees them go.

## Internal Mechanics
When Echo calls `join('presence-chat.1')`, it POSTs to `/broadcasting/auth` with the `presence-` prefixed channel name. The auth callback receives `$user` and returns user data array `['id' => 1, 'name' => 'Alice', ...]`. The Laravel auth endpoint generates a presence channel auth response that includes the user data. The WebSocket server (Reverb/Pusher) adds the user to its membership list, stores it in Redis (for persistence and scaling), and broadcasts a `pusher_internal:member_added` event to all subscribers (except the joiner). On unsubscribe, it broadcasts `pusher_internal:member_removed`. The `here` event is sent to the joining client with the serialized member list.

## Patterns
- **join() for subscription**: `Echo.join('chat.1')` returns a PresenceChannel instance
- **here/joining/leaving callbacks**: `.here(users => ...).joining(user => ...).leaving(user => ...)` for membership events
- **User data from auth callback**: The authorization callback determines what user info is shared with other members
- **Ghost member cleanup**: Periodic pruning of stale Redis presence state for disconnected clients

## Architectural Decisions
- **Membership in Redis**: Presence state persists in Redis for cross-instance visibility and crash recovery
- **Auth callback returns user data**: The authorization source is also the data source—single source of truth for user info
- **Internal events for membership**: Pusher protocol uses internal events (prefix `pusher_internal:`) for join/leave, not visible to application code

## Tradeoffs
- **Membership event overhead**: Every join/leave generates a broadcast to all channel members
- **Redis state cost**: Each member entry occupies Redis memory; large channels with frequent churn increase memory pressure
- **User data exposure**: All members see each other's data; avoid including sensitive information in auth callback return
- **Scale ceiling**: Presence channels with 10k+ members generate significant join/leave event traffic
- **Stale member problem**: Abrupt disconnections leave ghost members until timeout-based cleanup runs

## Performance Considerations
- Join/leave event fan-out is O(n) per event for n channel members
- `here` event payload size scales linearly with member count
- Redis writes on every join/leave; at high churn rates, this becomes write-intensive
- Presence channel auth callbacks execute on every subscription; optimize for speed
- Ghost member cleanup (pulse/prune mechanism) adds periodic database/Redis load

## Production Considerations
- Set TTL on Redis presence state keys to auto-cleanup ghost members
- Monitor presence channel member counts to detect abnormal patterns
- Implement custom ghost member cleanup if the default pulse interval is too slow
- Return minimal user data from auth callbacks (id, name, avatar URL—avoid email, phone, etc.)
- Consider private channels with separate "online status" polling for very large communities
- Test presence channel behavior with realistic join/leave churn rates

## Common Mistakes
- Returning the entire User model from presence auth callbacks (exposes PII to all channel members)
- Not implementing ghost member cleanup, causing inflated member counts over time
- Ignoring the `here` event and only listening for `joining`/`leaving` (new subscribers miss current state)
- Using `join()` without `authorization()` in Echo (presence channels always require auth)
- Expecting `here` events to fire for the joining user's own presence (it does not—only for existing members)

## Failure Modes
- **Ghost member accumulation**: Hard server crash leaves stale entries; member counts stay inflated until TTL/prune
- **Membership state corruption**: Redis data loss resets all presence channels; all members receive stale here/leaving events
- **Auth callback data inconsistency**: User data returned from callback changes (e.g., display name update) but cached version is stale
- **Presence storm**: Thousands of users join/leave simultaneously (e.g., at a scheduled event start), overwhelming Redis and WebSocket servers
- **Cross-instance presence sync failure**: Scaled Reverb instances fail to synchronize membership state; users see incomplete member lists

## Ecosystem Usage
- Chat applications: show who is currently in a chat room
- Collaborative editing: show who is viewing/editing a document
- Online game lobbies: show connected players
- Live dashboards: show active viewers of a dashboard
- Social features: "X other people are viewing this product"

## Related Knowledge Units
- K11: Public/Private/Presence Channel Patterns
- K12: Channel Authorization (routes/channels.php)
- K35: Ghost Member Cleanup in Presence Channels
- K34: Redis Dependency & Failure Modes

## Research Notes
Presence channels follow the Pusher protocol specification for membership events. The `pusher_internal:member_added` and `pusher_internal:member_removed` events are protocol-level events, not application events. Reverb stores presence membership in Redis under keys following the pattern `reverb:presence:{channelName}:members`. The `here()` event fires once per subscription, containing the current member list serialized from Redis. Ghost member cleanup in Reverb is performed by the Pulse/prune mechanism, which removes stale entries based on connection timeout thresholds.
