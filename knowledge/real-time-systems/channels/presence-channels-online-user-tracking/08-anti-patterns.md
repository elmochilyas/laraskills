# ECC Anti-Patterns — Presence Channels & Online User Tracking

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Channel Types & Authorization |
| **Knowledge Unit** | Presence Channels & Online User Tracking |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Over-Fetching Presence Data — Returning Full User Profiles
2. No Ghost Member Cleanup Configured
3. Ignoring here Event — Only Listening for joining/leaving
4. Presence as General Online Tracker
5. No TTL on Presence Keys

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries
- God Services

---

## Anti-Pattern 1: Over-Fetching Presence Data — Returning Full User Profiles

### Category
Security | Performance

### Description
Returning the entire User model from presence channel auth callbacks, broadcasting all user attributes (including PII) to every channel member with every join/leave event.

### Warning Signs
- Presence auth callback returns `$user` directly
- Presence events contain email, phone, address, roles
- All channel members receive full user profiles
- Sensitive fields visible in WebSocket messages

### Why It Is Harmful
The auth callback return value is broadcast to all channel members every time a user joins or leaves. Full user profiles expose PII (email, phone, address) and internal data to every subscriber.

### Real-World Consequences
A chat room presence callback returns `$user`. When user Alice joins, all 200 members receive Alice's full User model: email, phone, last login IP, internal notes field. Alice's privacy is violated.

### Preferred Alternative
Return only `['id' => $user->id, 'name' => $user->name, 'avatar' => $user->avatar_url]`.

### Refactoring Strategy
1. Identify all presence callbacks returning `$user`
2. Replace with explicit safe field array
3. Verify presence events contain no PII

### Detection Checklist
- [ ] Presence callback returns entire User model
- [ ] Sensitive fields in presence join/leave events
- [ ] PII exposed to all channel members

### Related Rules
- (Implied: minimal user data in presence callbacks — from best practices in knowledge)

---

## Anti-Pattern 2: No Ghost Member Cleanup Configured

### Category
Reliability

### Description
Not configuring ghost member cleanup mechanisms (Redis TTL, pulse/prune, database pruning), causing stale presence entries to accumulate and inflate online user counts indefinitely.

### Warning Signs
- Online user counts increase over time
- Users appear online long after disconnecting
- Redis memory grows from stale presence keys
- No pulse interval configured
- No prune job scheduled for database driver

### Why It Is Harmful
Abrupt disconnections (network drop, browser crash) leave ghost members in the presence store. Without cleanup, these accumulate over time, inflating online counts, degrading presence accuracy, and consuming Redis memory.

### Real-World Consequences
After 3 months in production, a chat app with 1,000 daily active users shows 15,000 "online" users at any time. 14,000 are ghosts accumulated from browser crashes and network drops. The member list is useless.

### Preferred Alternative
Configure Redis TTL on presence keys, set appropriate pulse interval, and schedule prune jobs for the database driver.

### Refactoring Strategy
1. Set `REVERB_ACTIVITY_TIMEOUT` (default 30s)
2. Set `REVERB_PULSE_INGEST_INTERVAL` (default 15s)
3. For database driver, schedule `reverb:prune` every minute
4. Monitor ghost member ratio

### Detection Checklist
- [ ] No cleanup mechanism configured
- [ ] Online counts inflating over time
- [ ] Redis memory growing from stale presence entries
- [ ] Users appear online after disconnect

### Related Rules
- (Implied: always configure ghost cleanup — from best practices in knowledge)

---

## Anti-Pattern 3: Ignoring here Event — Only Listening for joining/leaving

### Category
Framework Usage

### Description
Only listening for `joining` and `leaving` events in Echo without handling `here`, causing new subscribers to have an empty member list until someone else joins.

### Warning Signs
- Only `.joining()` and `.leaving()` listeners registered
- No `.here()` handler
- New subscribers see empty member list initially
- Member list populates only when others join

### Why It Is Harmful
The `here` event fires once for the subscribing client, containing the current member list. Without handling it, new subscribers start with an empty list and must wait for someone else to join to see members.

### Real-World Consequences
A user joins a chat room with 50 existing members. The frontend only handles `joining` and `leaving`. The user sees "0 online" for 5 minutes until someone else joins. The user thinks the room is empty and leaves.

### Preferred Alternative
Always handle `here` to initialize the member list on subscription.

### Refactoring Strategy
1. Add `.here((users) => { this.users = users; })` handler
2. Initialize local member list from `here` event
3. Append new members from `joining` and remove from `leaving`

### Detection Checklist
- [ ] No `.here()` handler registered
- [ ] New subscribers see empty member list
- [ ] Member list incorrect on initial join

### Related Rules
- (Implied: always handle here event — from common mistakes in knowledge)

---

## Anti-Pattern 4: Presence as General Online Tracker

### Category
Performance

### Description
Using presence channels per user just to show online/offline status, creating unnecessary join/leave broadcasts and Redis overhead when a simple heartbeat API would suffice.

### Warning Signs
- Each user has a separate presence channel for status
- No chat, collaboration, or social features exist
- Join/leave events broadcast to all users on every status change
- Redis write pressure from presence events

### Why It Is Harmful
Presence channels generate join/leave events broadcast to all members. For a global online tracker, every user connects/disconnect triggers N broadcasts (where N is active user count). This is O(n) fan-out for simple status tracking.

### Real-World Consequences
An app with 5,000 users uses presence channels for "online friends." When user #500 connects, 4,999 browsers receive a `joining` event. Each trigger Redis writes and WebSocket broadcasts. 60% of broadcast traffic is online status, not actual features.

### Preferred Alternative
Use private channels per user with a REST endpoint for online status, or Redis heartbeat with polling.

### Refactoring Strategy
1. Remove per-user presence channels
2. Implement Redis heartbeat: user pings every 30s
3. REST endpoint: `GET /api/users/status?ids=1,2,3`
4. Poll status periodically from client

### Detection Checklist
- [ ] Presence channels for every user
- [ ] No social/collaboration features
- [ ] High join/leave event volume
- [ ] Most broadcast traffic is status updates

### Related Rules
- (Implied: private + status API over presence for simple tracking — from knowledge)

---

## Anti-Pattern 5: No TTL on Presence Keys

### Category
Reliability

### Description
Not setting TTL on Redis presence membership keys, allowing stale entries to persist indefinitely until Redis runs out of memory.

### Warning Signs
- Presence keys in Redis without TTL
- Redis memory growing over time
- Ghost members never auto-removed
- Manual Redis key cleanup needed periodically

### Why It Is Harmful
Without TTL, Redis presence entries from disconnected clients persist indefinitely. Redis memory grows unbounded, eventually exhausting available memory and causing Redis to evict other data or crash.

### Real-World Consequences
Teams implement presence channels without Redis TTL. Over 6 months, Redis memory grows from 100MB to 4GB from accumulated ghost presence entries. Redis reaches memory limit and starts evicting cache entries. Application performance degrades from cache misses.

### Preferred Alternative
Set TTL on presence keys at 2x the activity timeout to ensure eventual cleanup.

### Refactoring Strategy
1. Configure Redis TTL on presence keys (handled automatically by Reverb when configured)
2. Verify TTL is set: `TTL reverb:presence:chat.1:members`
3. Set `activity_timeout` appropriately
4. Monitor Redis memory for presence keys

### Detection Checklist
- [ ] No TTL on presence Redis keys
- [ ] Redis memory growing over time
- [ ] Ghost members persist indefinitely
- [ ] Presence cleanup never happens automatically

### Related Rules
- (Implied: set TTL on presence keys — from anti-patterns in knowledge)
