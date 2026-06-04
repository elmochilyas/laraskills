## Always Apply Least Privilege When Choosing Channel Types
---
## Security
---
Always choose the most restrictive channel type that meets the application's requirements: private over public, presence over private only when needed.
---
Public channels expose data to any connected WebSocket client without authorization. Using them for user-specific data leaks information to unauthorized subscribers.
---
```php
return [new Channel('user.' . $this->user->id)]; // Public — anyone can listen
```
---
```php
return [new PrivateChannel('user.' . $this->user->id)]; // Authorized access
```
---
Global announcements and public dashboards. No common exceptions.
---
Data leakage; unauthorized access; compliance violations.

## Never Use Presence Channels When Private + API Status Suffices
---
## Performance
---
Avoid presence channels when the only requirement is knowing if a user is online; use private channels with a status endpoint instead.
---
Presence channels generate join/leave events to all members on every subscription change, creating O(n) fan-out and Redis write overhead that increases with channel size.
---
```php
// Presence channel just for online status — overkill
return [new PresenceChannel('user.status.' . $this->userId)];
```
---
```php
// Private channel + REST status endpoint
return [new PrivateChannel('user.' . $this->userId)]; // GET /api/users/{id}/status
```
---
Chat rooms, collaborative editing, and multi-user collaboration where presence awareness is core. No common exceptions.
---
Unnecessary broadcast overhead; Redis write pressure at scale.

## Always Parameterize Channel Names with Placeholders
---
## Maintainability
---
Always use `{param}` placeholders in channel name patterns instead of hardcoded names.
---
Hardcoded channel names require individual `Broadcast::channel()` registrations, creating an unmaintainable proliferation of callbacks as channels multiply.
---
```php
Broadcast::channel('order-1', ...); Broadcast::channel('order-2', ...); // Unmaintainable
```
---
```php
Broadcast::channel('orders.{orderId}', fn($user, $orderId) => ...); // Single pattern
```
---
Static singleton channels like global announcements. No common exceptions.
---
Callback proliferation; unmaintainable channel registration files.

## Always Use Conventional Naming for Channel Organization
---
## Design
---
Always use structured, hierarchical naming conventions like `resource.{identifier}` for channel names.
---
Flat or inconsistent naming makes it difficult to understand authorization patterns, debug subscription issues, and manage channel registrations at scale.
---
```php
Broadcast::channel('a1', ...); Broadcast::channel('b2', ...); // Opaque names
```
---
```php
Broadcast::channel('orders.{orderId}', fn($u, $id) => ...);
Broadcast::channel('chat.{roomId}', fn($u, $id) => ...);
Broadcast::channel('App.Models.User.{id}', fn($u, $id) => ...);
```
---
No common exceptions; structured naming is always preferable.
---
Confusing authorization patterns; debugging difficulty.

## Never Broadcast Sensitive Data on Public Channels
---
## Security
---
Never broadcast user-specific, financial, or personally identifiable information on public channels.
---
Any connected WebSocket client can subscribe to a public channel without authentication. Broadcasting sensitive data on public channels makes it accessible to anyone who connects.
---
```php
// Order details on public channel
return [new Channel('orders')];
```
---
```php
// User-specific orders on private channel
return [new PrivateChannel('orders.' . $this->order->user_id)];
```
---
Non-sensitive data (sports scores, public announcements, weather). No common exceptions.
---
Data leakage; compliance violations; unauthorized data access.

## Always Implement Auth Callbacks for Both Private and Presence Channels
---
## Framework Usage
---
Always register authorization callbacks in `routes/channels.php` for every private and presence channel pattern.
---
Without callbacks, the auth endpoint returns 403 for all subscription attempts to private/presence channels, and clients receive no events.
---
```php
// Missing callback — all private subscriptions fail
```
---
```php
Broadcast::channel('orders.{orderId}', fn($user, $orderId) => $user->id === (int)$orderId);
```
---
Public-channel-only applications. No common exceptions for private/presence usage.
---
Silent subscription failures; broken private channel features.
