# Standardized Knowledge: Real-Time Notifications (Broadcast + Database)

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | Real-Time Notifications |
| Knowledge Unit ID | K19 |
| Title | Real-Time Notifications (Broadcast + Database) |
| Difficulty | Intermediate |
| Dependencies | K20, K11, K01, K09 |

## Overview
Laravel's notification system provides a unified API for sending notifications across multiple channels, including broadcast (real-time WebSocket) and database (persistent storage). The broadcast notification channel automatically pushes notifications to the user's private channel (`App.Models.User.{id}`), enabling real-time delivery to connected clients. The database channel stores notifications in the `notifications` table for persistent history and offline access. Combining both channels in the same notification class provides instant delivery with reliable persistence.

## Core Concepts
- A Laravel notification class defines delivery channels in `via()`—adding `'broadcast'` enables real-time WebSocket delivery, `'database'` enables persistent storage
- `toBroadcast()` formats the notification for WebSocket delivery (returns `BroadcastMessage`), while `toDatabase()` or `toArray()` formats for database storage
- Broadcast notifications auto-target the notifiable entity's private channel (`App.Models.User.{id}`), customizable via `receivesBroadcastNotificationsOn()`
- Dual delivery: users receive notifications instantly when online (broadcast) and can review past notifications when offline (database)
- Echo's `.notification()` method listens for broadcast notifications on the user's private channel

## When To Use
- User notification bell UI with real-time badge counter
- Order status notifications that need both instant delivery and persistent history
- Social features (friend requests, likes, comment notifications)
- System alerts requiring online and offline access
- Any scenario where both immediacy and reliability are important

## When NOT To Use
- High-frequency notifications that would flood the database (use broadcast-only with database sparingly)
- Notifications requiring guaranteed delivery (broadcast is fire-and-forget; database is persistent but not real-time)
- Notifications that must survive beyond the database's capacity

## Best Practices (Why)
- **Return `['database', 'broadcast']` in `via()`**: Provides both instant delivery and persistent history in one notification class
- **Use `toBroadcast()` and `toDatabase()` separately**: Different channels may need different data structures—broadcast payloads should be minimal (notification ID, type, summary), while database storage can store full content
- **Configure `BroadcastMessage::onQueue('notifications')`**: Route broadcast notifications to a dedicated queue to prevent blocking other job types
- **Implement notification pruning**: Delete read notifications older than N days via scheduled task to prevent unbounded table growth
- **Define `receivesBroadcastNotificationsOn()` on the User model**: Customize the broadcast channel name for multi-tenant or custom routing scenarios
- **Set up Echo's `.notification()` listener in a persistent component**: The app shell or layout, not a page component, ensures listeners survive navigation

## Architecture Guidelines
- Index the `notifications` table on `notifiable_id` and `read_at` for query performance
- Use a dedicated queue connection for high-volume notification systems to prevent blocking other job types
- Test dual delivery behavior: broadcast should be instant, database should be available on page load
- Configure private channel auth for `App.Models.User.{id}` in `routes/channels.php`

## Performance Considerations
- Database notifications insert into a single `notifications` table—index properly
- Mark-as-read operations generate database writes; batch updates for marking multiple notifications
- Broadcast notification payload should be minimal (notification ID, type, summary—not full content)
- High-volume systems should use a dedicated queue connection
- Prune old notifications regularly

## Security Considerations
- Broadcast notifications auto-target the user's private channel, ensuring only the intended user receives them
- Private channel auth must be properly configured in `routes/channels.php` to prevent unauthorized access
- Notification payloads may contain sensitive data—ensure broadcast payloads are minimal and database notifications are properly scoped

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Forgetting broadcast in via() | Notifications never sent as real-time | Developer assumes broadcast is automatic | Users don't see instant notifications | Always return `['database', 'broadcast']` when dual delivery is needed |
| Missing auth configuration | Echo cannot receive notifications | Private channel auth not set up for `App.Models.User.{id}` | No notifications arrive on the frontend | Configure channel auth in `routes/channels.php` |
| Using toArray() for both channels | Same data structure for database and broadcast when different is needed | Developer unaware of separate formatting methods | Over-fetched or under-fetched data per channel | Use `toBroadcast()` and `toDatabase()` separately |
| Full object in broadcast payload | Sending entire notification object over WebSocket | Convenience over minimal payload design | Increased bandwidth, slower delivery, potential serialization errors | Send only notification ID, type, and summary |
| No notification pruning | Database grows unbounded | Missing scheduled cleanup task | Performance degradation, storage costs | Implement scheduled pruning of old read notifications |

## Anti-Patterns
- **Sending database-only notifications when real-time is expected**: Users won't see updates until they refresh the page
- **Broadcast-only for critical notifications**: Users who are offline will miss the notification entirely
- **Using the same database for notifications and application data without separation**: Notification queries can compete with critical application queries
- **Not handling the duplicate delivery scenario**: Online users receive notifications instantly via broadcast and later fetch them from the database when loading the notification list—design the UI to handle this gracefully

## Examples

### Standard dual-channel notification class
```php
class OrderShipped extends Notification
{
    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'order_id' => $this->order->id,
            'status' => 'shipped',
            'summary' => "Order #{$this->order->id} has shipped",
        ]);
    }

    public function toDatabase($notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'status' => 'shipped',
            'items' => $this->order->items->pluck('name'),
            'total' => $this->order->total,
            'tracking_number' => $this->order->tracking_number,
        ];
    }
}
```

### Echo listener in layout component
```javascript
Echo.private(`App.Models.User.${userId}`)
    .notification((notification) => {
        // Update badge counter
        unreadCount.value++;
        // Add to notification list
        notifications.value.unshift(notification);
    });
```

## Related Topics
- K20: Real-Time Dashboard Architecture
- K11: Public/Private/Presence Channel Patterns
- K01: Laravel Broadcasting Architecture
- K09: Laravel Echo Core API

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- The `BroadcastMessage` class extends `Queueable`, providing full queue configuration
- `receivesBroadcastNotificationsOn()` on the notifiable model allows custom channel naming
- The combination of database + broadcast channels provides both reliability (persistence) and immediacy (real-time)
- This pattern has been stable since Laravel 5.3

## Verification
- [ ] Notification class has `via()` returning `['database', 'broadcast']`
- [ ] `toBroadcast()` returns minimal payload (ID, type, summary)
- [ ] `toDatabase()` stores full notification data
- [ ] Private channel auth configured for `App.Models.User.{id}` in `routes/channels.php`
- [ ] Echo `.notification()` listener set up in persistent component
- [ ] Scheduled task for pruning old notifications
- [ ] Batch mark-as-read handler implemented
- [ ] Dedicated queue for broadcast notifications configured
