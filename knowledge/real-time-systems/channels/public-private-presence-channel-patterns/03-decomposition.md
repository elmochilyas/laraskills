# Decomposition: Public Private Presence Channel Patterns

## Topic Overview
Laravel broadcasting defines three channel types with escalating access control: public (any connected client can subscribe), private (authenticated and authorized users only), and presence (extends private with per-user online awareness). Public channels use the `Channel` class and require no authorization. Private channels use the `PrivateChannel` class and require a matching authorization callback in `routes/channels.php`. Presence channels use the `PresenceChannel` class and additionally ...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
channel-types-authorization/K11-public-private-presence-channel-patterns/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Public Private Presence Channel Patterns
- **Purpose:** Laravel broadcasting defines three channel types with escalating access control: public (any connected client can subscribe), private (authenticated and authorized users only), and presence (extends private with per-user online awareness). Public channels use the `Channel` class and require no authorization. Private channels use the `PrivateChannel` class and require a matching authorization callback in `routes/channels.php`. Presence channels use the `PresenceChannel` class and additionally ...
- **Difficulty:** Foundation
- **Dependencies:
  - K12: Channel Authorization (routes/channels.php)
  - K13: Presence Channels & Online User Tracking
  - K29: Private Channel Auth with JWT/Sanctum
  - K01: Laravel Broadcasting Architecture

## Dependency Graph
**Depends on:**
  - K12: Channel Authorization (routes/channels.php)
  - K13: Presence Channels & Online User Tracking
  - K29: Private Channel Auth with JWT/Sanctum
  - K01: Laravel Broadcasting Architecture

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Public**: A public bulletin board—anyone can read it.**Private**: Your personal inbox—you must prove identity and authorization to access.**Presence**: A meeting room with a nametag display—you get access after authorization, and you can see who else is in the room.**Least privilege by channel type**: Start with private; downgrade to public only when no authorization needed**Parameterized channel names**: Use `{id}` or `{slug}` placeholders in `Broadcast::channel()` callbacks**Presence for social features**: Chat rooms, collaborative editing, shared dashboards**Conventional naming**: `orders.{orderId}`, `App.Models.User.{id}`, `chat.{roomId}`**Channel authorization at subscription time**: Unlike coarse API-level auth, channel auth is granular per-channel**Presence data returned from auth callback**: The callback determines what user data is visible to other members**Server validates auth signatures**: The WebSocket server verifies auth tokens created by the Laravel application**Public channels provide no access control**: Any connected client (even unauthenticated) can subscribe and receive events**Presence channels increase overhead**: Each join/leave event generates a broadcast to all channel members plus Redis writes**Presence scale cost**: At thousands of users on a single channel, join/leave events create significant traffic**Auth endpoint latency**: Private channel subscription requires an HTTP request before subscription completesPublic channels have zero auth overhead (fastest subscription)Private channels add one HTTP round-trip per subscription (auth endpoint latency)Presence channels add auth + membership tracking overhead (Redis writes, event broadcasts)At scale, presence channels should be used sparingly; consider private channels with separate online status endpointsMembership state for presence channels is stored in Redis; large channels with frequent joins/leaves increase write pressureAlways use private or presence channels for user-specific dataImplement auth caching for frequently subscribed private channels to reduce auth endpoint loadMonitor presence channel membership sizes and prune stale connectionsUse the `receivesBroadcastNotificationsOn` method on notifiable entities to customize notification channel namesTest channel authorization with different user roles and permissionsBroadcasting sensitive user data on public channels (any connected client can receive it)Not using parameterized channel names, creating a separate channel per entity without structureReturning too much user data from presence channel auth callbacks (exposes PII to all members)Forgetting that presence channel members receive their own join eventUsing presence channels when private channels with a separate "get online users" API would suffice**Auth callback exception**: Unhandled exception in authorization callback prevents all subscriptions to that channel**Presence state corruption**: Redis data loss causes incorrect online user counts**Public channel data leak**: Sensitive event broadcast on public channel instead of private**Channel name collision**: Same channel name used for different purposes in different contexts**Auth signature replay**: Old auth signatures reused if no expiry mechanismPublic channels: live blog updates, public dashboards, sports scores, announcementsPrivate channels: user-specific notifications, order updates, personal dashboardsPresence channels: chat applications, collaborative editing, multiplayer features, shared workspacesLaravel Notifications automatically use private channels named `App.Models.User.{id}`K12: Channel Authorization (routes/channels.php)K13: Presence Channels & Online User TrackingK29: Private Channel Auth with JWT/SanctumK01: Laravel Broadcasting Architecture

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