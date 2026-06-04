# Decomposition: Presence Channels Online User Tracking

## Topic Overview
Presence channels extend private channels with real-time online user awareness. When a user subscribes to a presence channel, all other subscribers receive a `joining` event; when they leave, a `leaving` event fires; and new subscribers immediately receive a `here` event with the current member list. The presence channel authorization callback must return an array of user data (with at least `id` and `name` fields). Laravel stores presence membership state in Redis (for Reverb) or the configu...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
channel-types-authorization/K13-presence-channels-online-user-tracking/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Presence Channels Online User Tracking
- **Purpose:** Presence channels extend private channels with real-time online user awareness. When a user subscribes to a presence channel, all other subscribers receive a `joining` event; when they leave, a `leaving` event fires; and new subscribers immediately receive a `here` event with the current member list. The presence channel authorization callback must return an array of user data (with at least `id` and `name` fields). Laravel stores presence membership state in Redis (for Reverb) or the configu...
- **Difficulty:** Intermediate
- **Dependencies:
  - K11: Public/Private/Presence Channel Patterns
  - K12: Channel Authorization (routes/channels.php)
  - K35: Ghost Member Cleanup in Presence Channels
  - K34: Redis Dependency & Failure Modes

## Dependency Graph
**Depends on:**
  - K11: Public/Private/Presence Channel Patterns
  - K12: Channel Authorization (routes/channels.php)
  - K35: Ghost Member Cleanup in Presence Channels
  - K34: Redis Dependency & Failure Modes

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **join() for subscription**: `Echo.join('chat.1')` returns a PresenceChannel instance**here/joining/leaving callbacks**: `.here(users => ...).joining(user => ...).leaving(user => ...)` for membership events**User data from auth callback**: The authorization callback determines what user info is shared with other members**Ghost member cleanup**: Periodic pruning of stale Redis presence state for disconnected clients**Membership in Redis**: Presence state persists in Redis for cross-instance visibility and crash recovery**Auth callback returns user data**: The authorization source is also the data source—single source of truth for user info**Internal events for membership**: Pusher protocol uses internal events (prefix `pusher_internal:`) for join/leave, not visible to application code**Membership event overhead**: Every join/leave generates a broadcast to all channel members**Redis state cost**: Each member entry occupies Redis memory; large channels with frequent churn increase memory pressure**User data exposure**: All members see each other's data; avoid including sensitive information in auth callback return**Scale ceiling**: Presence channels with 10k+ members generate significant join/leave event traffic**Stale member problem**: Abrupt disconnections leave ghost members until timeout-based cleanup runsJoin/leave event fan-out is O(n) per event for n channel members`here` event payload size scales linearly with member countRedis writes on every join/leave; at high churn rates, this becomes write-intensivePresence channel auth callbacks execute on every subscription; optimize for speedGhost member cleanup (pulse/prune mechanism) adds periodic database/Redis loadSet TTL on Redis presence state keys to auto-cleanup ghost membersMonitor presence channel member counts to detect abnormal patternsImplement custom ghost member cleanup if the default pulse interval is too slowReturn minimal user data from auth callbacks (id, name, avatar URL—avoid email, phone, etc.)Consider private channels with separate "online status" polling for very large communitiesTest presence channel behavior with realistic join/leave churn ratesReturning the entire User model from presence auth callbacks (exposes PII to all channel members)Not implementing ghost member cleanup, causing inflated member counts over timeIgnoring the `here` event and only listening for `joining`/`leaving` (new subscribers miss current state)Using `join()` without `authorization()` in Echo (presence channels always require auth)Expecting `here` events to fire for the joining user's own presence (it does not—only for existing members)**Ghost member accumulation**: Hard server crash leaves stale entries; member counts stay inflated until TTL/prune**Membership state corruption**: Redis data loss resets all presence channels; all members receive stale here/leaving events**Auth callback data inconsistency**: User data returned from callback changes (e.g., display name update) but cached version is stale**Presence storm**: Thousands of users join/leave simultaneously (e.g., at a scheduled event start), overwhelming Redis and WebSocket servers**Cross-instance presence sync failure**: Scaled Reverb instances fail to synchronize membership state; users see incomplete member listsChat applications: show who is currently in a chat roomCollaborative editing: show who is viewing/editing a documentOnline game lobbies: show connected playersLive dashboards: show active viewers of a dashboardSocial features: "X other people are viewing this product"K11: Public/Private/Presence Channel PatternsK12: Channel Authorization (routes/channels.php)K35: Ghost Member Cleanup in Presence ChannelsK34: Redis Dependency & Failure Modes

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