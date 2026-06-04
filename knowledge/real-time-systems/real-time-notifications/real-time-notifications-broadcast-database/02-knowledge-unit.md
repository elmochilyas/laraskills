# Metadata
Domain: Real-Time Systems
Subdomain: Real-Time Notifications
Knowledge Unit: Real-Time Notifications (Broadcast + Database)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Laravel's notification system provides a unified API for sending notifications across multiple channels, including broadcast (real-time WebSocket) and database (persistent storage). The broadcast notification channel automatically pushes notifications to the user's private channel (`App.Models.User.{id}`), enabling real-time delivery to connected clients. The database channel stores notifications in the `notifications` table for persistent history and offline access. Combining both channels in the same notification class provides instant delivery (broadcast) with reliable persistence (database). The `via()` method on the notification class returns `['database', 'broadcast']` for dual delivery. Echo's `.notification()` method listens for broadcast notifications on the user's private channel.

## Core Concepts
A Laravel notification class defines delivery channels in `via()`. Adding `'broadcast'` enables real-time WebSocket delivery; adding `'database'` enables persistent storage. The `toBroadcast()` method formats the notification for WebSocket delivery (returns `BroadcastMessage`), while `toDatabase()` or `toArray()` formats for storage. The broadcast channel automatically targets the notifiable entity's private channel: `App.Models.User.{id}` by default (customizable via `receivesBroadcastNotificationsOn()`). Dual delivery ensures users receive notifications instantly when online (broadcast) and can review past notifications when offline (database).

## Mental Models
Think of broadcast + database notifications as a messenger who both shouts (broadcast for active listeners) and writes a letter (database for record keeping). Active users hear the shout immediately; users who step away read the letter when they return.

## Internal Mechanics
When `$user->notify(new OrderShipped($order))` is called with `via()` returning `['database', 'broadcast']`, Laravel's notification system processes each channel. For the `database` channel, it serializes the notification data and inserts a row in the `notifications` table. For the `broadcast` channel, it creates a broadcast event that implements `ShouldBroadcast`, targeting the private channel `App.Models.User.{id}`. The broadcast is queued (standard broadcasting behavior). On the client side, `Echo.private('App.Models.User.' + userId).notification((notification) => { ... })` receives the broadcast notification and can update the UI in real time.

## Patterns
- **Dual channel delivery**: `via()` returns `['database', 'broadcast']` for persistence + real-time
- **`toBroadcast()` for broadcast-specific data**: Different payload from `toDatabase()` if needed
- **`BroadcastMessage` for queue configuration**: `onConnection()` and `onQueue()` for dedicated broadcast queue
- **Echo `.notification()` listener**: Specific helper method for listening to broadcast notifications
- **Mark as read**: `$notification->markAsRead()` updates the `read_at` timestamp; real-time UI update via broadcast

## Architectural Decisions
- **Automatic private channel targeting**: Notifications default to `App.Models.User.{id}`; no manual channel definition needed
- **Queue-backed broadcast notifications**: Broadcast notifications are always queued; configurable via `BroadcastMessage::onQueue()`
- **Separate formatting methods**: `toBroadcast()` and `toDatabase()` allow different data structures for each channel

## Tradeoffs
- **Database storage overhead**: Each notification creates a database row; high-volume notifications require pruning or archiving
- **Duplicate delivery**: Online users receive notifications instantly (broadcast) and later fetch them from the database when loading the notification list
- **Notification model serialization**: Notifications are serialized to arrays; complex data structures require manual serialization
- **Queue dependency**: Broadcast notifications require a running queue worker; delays if queue is backlogged

## Performance Considerations
- Database notifications insert into a single `notifications` table; index on `notifiable_id` and `read_at` for query performance
- Mark-as-read operations generate database writes; batch updates for marking multiple notifications
- Broadcast notification payload should be minimal (notification ID, type, summary—not full content)
- High-volume notification systems should use a dedicated queue connection to prevent blocking other job types
- Prune old notifications regularly (`Model::whereNotNull('read_at')->where('created_at', '<', now()->subMonths(3))->delete()`)

## Production Considerations
- Define `receivesBroadcastNotificationsOn()` on the User model if using custom channel names
- Implement notification pruning: delete read notifications older than N days via scheduled task
- Set up Echo's `.notification()` listener in a persistent component (layout/app shell, not a page component)
- Use `BroadcastMessage::onQueue('notifications')` to route broadcast notifications to a dedicated queue
- Monitor database notifications table growth and query performance
- Test dual delivery behavior: broadcast should be instant; database should be available on page load

## Common Mistakes
- Forgetting to add `'broadcast'` to `via()` and wondering why notifications aren't real-time
- Not configuring Echo's private channel auth for `App.Models.User.{id}` in `routes/channels.php`
- Using `toArray()` for both database and broadcast formatting when different data is needed (use `toDatabase()` separately)
- Sending the entire notification object in the broadcast payload instead of minimal summary data
- Not pruning old notifications from the database, causing unbounded table growth

## Failure Modes
- **Broadcast queue backlog**: High notification volume delays delivery; users see notifications in database before broadcast
- **Authorization failure**: Private channel auth for `App.Models.User.{id}` not configured; Echo receives no notifications
- **Database notification table bloat**: Millions of unpruned notifications degrade query performance
- **Mark-as-read race**: User marks notification as read; broadcast event arrives after read timestamp; UI shows unread briefly
- **Serialization overflow**: Complex data in `toBroadcast()` exceeds message size limit; broadcast fails

## Ecosystem Usage
- User notification bell UI with real-time badge counter
- Order status notifications (shipped, delivered, cancelled)
- Social features (friend request, like, comment notifications)
- System alerts (account changes, security events, billing updates)
- Application-specific event notifications (new content, mentions, assignments)

## Related Knowledge Units
- K20: Real-Time Dashboard Architecture
- K11: Public/Private/Presence Channel Patterns
- K01: Laravel Broadcasting Architecture
- K09: Laravel Echo Core API

## Research Notes
Laravel's notification system has been stable since Laravel 5.3. The broadcast channel integration with notifications is one of the most commonly used real-time features. The `BroadcastMessage` class extends `Queueable`, providing full queue configuration (connection, queue name, delay, middleware, chaining). The `receivesBroadcastNotificationsOn()` method on the notifiable model allows customizing the broadcast channel name for multi-tenant or custom routing scenarios. The combination of database + broadcast channels provides both reliability (persistence) and immediacy (real-time), covering online and offline users.
