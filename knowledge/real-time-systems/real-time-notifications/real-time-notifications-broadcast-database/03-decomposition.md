# Decomposition: Real Time Notifications Broadcast Database

## Topic Overview
Laravel's notification system provides a unified API for sending notifications across multiple channels, including broadcast (real-time WebSocket) and database (persistent storage). The broadcast notification channel automatically pushes notifications to the user's private channel (`App.Models.User.{id}`), enabling real-time delivery to connected clients. The database channel stores notifications in the `notifications` table for persistent history and offline access. Combining both channels i...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
real-time-notifications/K19-real-time-notifications-broadcast-database/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Real Time Notifications Broadcast Database
- **Purpose:** Laravel's notification system provides a unified API for sending notifications across multiple channels, including broadcast (real-time WebSocket) and database (persistent storage). The broadcast notification channel automatically pushes notifications to the user's private channel (`App.Models.User.{id}`), enabling real-time delivery to connected clients. The database channel stores notifications in the `notifications` table for persistent history and offline access. Combining both channels i...
- **Difficulty:** Intermediate
- **Dependencies:
  - K20: Real-Time Dashboard Architecture
  - K11: Public/Private/Presence Channel Patterns
  - K01: Laravel Broadcasting Architecture
  - K09: Laravel Echo Core API

## Dependency Graph
**Depends on:**
  - K20: Real-Time Dashboard Architecture
  - K11: Public/Private/Presence Channel Patterns
  - K01: Laravel Broadcasting Architecture
  - K09: Laravel Echo Core API

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Dual channel delivery**: `via()` returns `['database', 'broadcast']` for persistence + real-time**`toBroadcast()` for broadcast-specific data**: Different payload from `toDatabase()` if needed**`BroadcastMessage` for queue configuration**: `onConnection()` and `onQueue()` for dedicated broadcast queue**Echo `.notification()` listener**: Specific helper method for listening to broadcast notifications**Mark as read**: `$notification->markAsRead()` updates the `read_at` timestamp; real-time UI update via broadcast**Automatic private channel targeting**: Notifications default to `App.Models.User.{id}`; no manual channel definition needed**Queue-backed broadcast notifications**: Broadcast notifications are always queued; configurable via `BroadcastMessage::onQueue()`**Separate formatting methods**: `toBroadcast()` and `toDatabase()` allow different data structures for each channel**Database storage overhead**: Each notification creates a database row; high-volume notifications require pruning or archiving**Duplicate delivery**: Online users receive notifications instantly (broadcast) and later fetch them from the database when loading the notification list**Notification model serialization**: Notifications are serialized to arrays; complex data structures require manual serialization**Queue dependency**: Broadcast notifications require a running queue worker; delays if queue is backloggedDatabase notifications insert into a single `notifications` table; index on `notifiable_id` and `read_at` for query performanceMark-as-read operations generate database writes; batch updates for marking multiple notificationsBroadcast notification payload should be minimal (notification ID, type, summary—not full content)High-volume notification systems should use a dedicated queue connection to prevent blocking other job typesPrune old notifications regularly (`Model::whereNotNull('read_at')->where('created_at', '<', now()->subMonths(3))->delete()`)Define `receivesBroadcastNotificationsOn()` on the User model if using custom channel namesImplement notification pruning: delete read notifications older than N days via scheduled taskSet up Echo's `.notification()` listener in a persistent component (layout/app shell, not a page component)Use `BroadcastMessage::onQueue('notifications')` to route broadcast notifications to a dedicated queueMonitor database notifications table growth and query performanceTest dual delivery behavior: broadcast should be instant; database should be available on page loadForgetting to add `'broadcast'` to `via()` and wondering why notifications aren't real-timeNot configuring Echo's private channel auth for `App.Models.User.{id}` in `routes/channels.php`Using `toArray()` for both database and broadcast formatting when different data is needed (use `toDatabase()` separately)Sending the entire notification object in the broadcast payload instead of minimal summary dataNot pruning old notifications from the database, causing unbounded table growth**Broadcast queue backlog**: High notification volume delays delivery; users see notifications in database before broadcast**Authorization failure**: Private channel auth for `App.Models.User.{id}` not configured; Echo receives no notifications**Database notification table bloat**: Millions of unpruned notifications degrade query performance**Mark-as-read race**: User marks notification as read; broadcast event arrives after read timestamp; UI shows unread briefly**Serialization overflow**: Complex data in `toBroadcast()` exceeds message size limit; broadcast failsUser notification bell UI with real-time badge counterOrder status notifications (shipped, delivered, cancelled)Social features (friend request, like, comment notifications)System alerts (account changes, security events, billing updates)Application-specific event notifications (new content, mentions, assignments)K20: Real-Time Dashboard ArchitectureK11: Public/Private/Presence Channel PatternsK01: Laravel Broadcasting ArchitectureK09: Laravel Echo Core API

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