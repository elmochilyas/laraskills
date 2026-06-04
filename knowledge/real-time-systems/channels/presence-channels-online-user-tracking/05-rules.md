## Never Return Sensitive PII in Presence Auth Callbacks
---
## Security
---
Always return only `id`, `name`, and optionally `avatar_url` from presence channel authorization callbacks.
---
The data returned from a presence auth callback is broadcast to all current and future channel members. Including email, phone, address, or internal identifiers exposes sensitive information to every subscriber.
---
```php
Broadcast::channel('chat.{id}', fn($user, $id) => [  // Returns entire User
    'email' => $user->email, 'phone' => $user->phone, ...
]);
```
---
```php
Broadcast::channel('chat.{id}', fn($user, $id) => [
    'id' => $user->id, 'name' => $user->name, 'avatar' => $user->avatar_url,
]);
```
---
No common exceptions; presence data is visible to all members.
---
PII exposure; compliance violations; privacy complaints.

## Always Handle the `here` Event on Presence Channel Join
---
## Framework Usage
---
Always subscribe to the `here` event to receive the initial member list when joining a presence channel.
---
The `here` event provides the current member list to the joining client. Ignoring it means new subscribers start with an empty member list and must wait for other members to send `joining` events.
---
```javascript
Echo.join('chat.' + roomId)
    .joining((user) => users.push(user)) // Missing here() — starts empty
```
---
```javascript
Echo.join('chat.' + roomId)
    .here((users) => memberList = users) // Initialize from current state
    .joining((user) => memberList.push(user))
    .leaving((user) => memberList = memberList.filter(u => u.id !== user.id));
```
---
Applications that re-fetch member lists via API on join. No common exceptions for real-time presence.
---
Empty initial member lists; delayed user awareness.

## Always Configure Ghost Member Cleanup
---
## Reliability
---
Always configure TTL-based cleanup and pulse/prune mechanisms for presence channel state.
---
Without ghost cleanup, abrupt disconnections (network drops, browser crashes) leave stale member entries. Over time, online user counts become inaccurate and Redis memory grows unbounded.
---
```env
# No ghost cleanup configured
```
---
```env
REVERB_ACTIVITY_TIMEOUT=30
REVERB_PULSE_INGEST_INTERVAL=15
```
---
Ephemeral channels with very short lifetimes. No common exceptions for production.
---
Inflated member counts; Redis memory waste; inaccurate presence data.

## Always Monitor Presence Channel Size for Anomalies
---
## Maintainability
---
Always track presence channel member counts and set alerts for abnormal patterns (sudden drops, excessive growth).
---
Sudden drops indicate crashes or network partitions. Excessive growth may indicate a ghost member accumulation bug or attack. Without monitoring, these go undetected until users complain.
---
```javascript
// No presence size monitoring
```
---
```javascript
Echo.join('chat.' + roomId)
    .here((users) => {
        if (users.length > expectedMax) alertChannelOversize();
        if (users.length < expectedMin) alertChannelUndersize();
    });
```
---
Development environments. No common exceptions for production.
---
Undetected ghost accumulation; missed crash indicators.

## Never Use Presence Channels for Simple Online/Offline Status
---
## Performance
---
Avoid using presence channels when a private channel with a separate "get online users" API endpoint would suffice.
---
Presence channels generate join/leave event fan-out to all members on every subscription change. For applications that only need to show whether a specific user is online, this overhead is unnecessary.
---
```php
// Presence channel for every user's status — massive overhead
Broadcast::channel('user.status.{id}', fn($user, $id) => ['id' => $user->id]);
```
---
```php
// Private channel + status API endpoint
GET /api/users/{id}/status  // Simple and efficient
```
---
Applications requiring real-time multi-user collaboration (chat rooms, collaborative editing). No common exceptions.
---
Unnecessary join/leave overhead; Redis write pressure; wasted bandwidth.

## Always Return a User Data Array from Presence Auth Callbacks
---
## Framework Usage
---
Always return an array (not `true`/`false`) from presence channel authorization callbacks to provide member data.
---
Presence channel callbacks must return an array to include user data in the member list. Returning `true` omits the user from presence data, breaking the `here`/`joining`/`leaving` event payloads.
---
```php
Broadcast::channel('chat.{roomId}', fn($user, $roomId) => true); // No user data
```
---
```php
Broadcast::channel('chat.{roomId}', fn($user, $roomId) => [
    'id' => $user->id, 'name' => $user->name, 'avatar' => $user->avatar_url,
]);
```
---
No common exceptions; presence requires user data arrays.
---
Broken presence events; missing member information.
