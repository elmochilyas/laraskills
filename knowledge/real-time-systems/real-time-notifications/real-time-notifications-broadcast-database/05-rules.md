## Always Return `['database', 'broadcast']` in `via()` for Dual Delivery
---
## Framework Usage
---
Always return both `'database'` and `'broadcast'` in the notification `via()` method to provide instant and persistent delivery.
---
Using broadcast-only means offline users miss the notification entirely. Using database-only means connected users don't see updates in real-time.
---
```php
public function via($notifiable): array {
    return ['broadcast']; // Offline users miss notifications
}
```
---
```php
public function via($notifiable): array {
    return ['database', 'broadcast']; // Instant + persistent
}
```
---
High-frequency notifications that would flood the database. No common exceptions for important notifications.
---
Missed notifications; delayed delivery; poor user experience.

## Always Use Separate `toBroadcast()` and `toDatabase()` Methods
---
## Design
---
Always define distinct `toBroadcast()` and `toDatabase()` methods with appropriate payloads for each channel.
---
Using `toArray()` for both channels sends the same data structure everywhere. Broadcast payloads should be minimal (ID, type, summary), while database can store full content.
---
```php
public function toArray($notifiable): array { // Used for both — oversized broadcast
    return ['order_id' => 1, 'items' => [...], 'total' => 100, ...];
}
```
---
```php
public function toBroadcast($notifiable): BroadcastMessage {
    return new BroadcastMessage(['order_id' => 1, 'summary' => 'Order shipped']);
}
public function toDatabase($notifiable): array {
    return ['order_id' => 1, 'items' => [...], 'total' => 100, 'tracking' => '...'];
}
```
---
Notifications with identical requirements for both channels. No common exceptions.
---
Oversized broadcast payloads; wasted bandwidth; slower delivery.

## Always Configure Private Channel Auth for `App.Models.User.{id}`
---
## Security
---
Always register an authorization callback for the `App.Models.User.{id}` channel pattern in `routes/channels.php`.
---
Broadcast notifications automatically target the notifiable entity's private channel (`App.Models.User.{id}`). Without auth configuration, all notification subscriptions return 403.
---
```php
// No auth callback — all notification subscriptions fail
```
---
```php
Broadcast::channel('App.Models.User.{id}', fn($user, $id) => (int) $user->id === (int) $id);
```
---
Applications using custom `receivesBroadcastNotificationsOn()` method. No common exceptions.
---
Silent notification failures; users never receive broadcast notifications.

## Always Implement Notification Pruning
---
## Maintainability
---
Always schedule a command to prune read notifications older than a configurable threshold.
---
Without pruning, the `notifications` table grows unbounded, degrading query performance and consuming storage for stale data.
---
```php
// No pruning — table grows indefinitely
```
```php
$schedule->call(fn() => 
    DatabaseNotification::whereNotNull('read_at')
        ->where('created_at', '<', now()->subDays(30))
        ->delete()
)->daily();
```
---
Applications that need permanent notification history. No common exceptions.
---
Unbounded table growth; query performance degradation.

## Always Set Up Echo `.notification()` Listener in Persistent Components
---
## Framework Usage
---
Always place Echo's `.notification()` listener in a persistent layout or shell component, not in a page component.
---
Page components are destroyed on navigation. If the notification listener is in a page component, it's unsubscribed when the user navigates, causing missed notifications.
---
```vue
// Page component — listener dies on navigation
<script setup>
Echo.private(`App.Models.User.${id}`).notification(handler);
</script>
```
---
```vue
// Layout component — survives navigation
<script setup>
Echo.private(`App.Models.User.${id}`).notification(handler);
</script>
```
---
Single-page applications where the notification component is always mounted. No common exceptions.
---
Missed notifications during navigation; inconsistent badge counts.

## Always Configure a Dedicated Queue for Broadcast Notifications
---
## Performance
---
Always use `BroadcastMessage::onQueue('notifications')` to route broadcast notifications to a dedicated queue.
---
Sharing the default queue means a burst of notifications blocks other job types (email, report generation), and vice versa.
---
```php
public function toBroadcast($notifiable): BroadcastMessage {
    return new BroadcastMessage([...]); // Uses default queue
}
```
---
```php
public function toBroadcast($notifiable): BroadcastMessage {
    return (new BroadcastMessage([...]))->onQueue('notifications');
}
```
---
Low-volume notification systems. No common exceptions for high-volume systems.
---
Queue contention; delayed notifications and other jobs.
