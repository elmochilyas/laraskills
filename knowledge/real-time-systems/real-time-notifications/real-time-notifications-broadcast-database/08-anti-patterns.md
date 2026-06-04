# ECC Anti-Patterns — Real-Time Notifications (Broadcast + Database)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Real-Time Notifications |
| **Knowledge Unit** | Real-Time Notifications (Broadcast + Database) |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Database-Only Notifications When Real-Time Is Expected
2. No Notification Pruning (Unbounded Table Growth)
3. Echo .notification() Listener in Page Component (Missed on Navigation)
4. Shared Queue for Broadcast Notifications and Other Jobs
5. Full Object in Broadcast Notification Payload

---

## Repository-Wide Anti-Patterns

- God Services
- Hidden Database Queries

---

## Anti-Pattern 1: Database-Only Notifications When Real-Time Is Expected

### Category
Framework Usage

### Description
Returning only `'database'` in the notification `via()` method (or omitting `'broadcast'`) when users expect real-time delivery, forcing them to refresh the page to see new notifications.

### Warning Signs
- `via()` returns `['database']` or `['mail', 'database']`
- `'broadcast'` channel not included
- Users must refresh the page to see new notifications
- Notification dropdown shows stale data until manual refresh

### Why It Is Harmful
Database-only notifications require a page refresh, polling, or manual interaction to appear. Users accustomed to real-time behavior (mobile push notifications, Slack, email) perceive the application as slow or broken. The notification infrastructure exists but the real-time delivery channel is simply not activated.

### Real-World Consequences
A team implements a notification system with database storage. Users see a notification bell icon but notifications only appear after a page refresh. Users click the bell, see nothing, click again after refreshing, and see new notifications. They file bug reports saying "notifications don't work."

### Preferred Alternative
Return `['database', 'broadcast']` in `via()` to provide both persistent storage and real-time WebSocket delivery.

### Refactoring Strategy
1. Add `'broadcast'` to the `via()` return array
2. Implement `toBroadcast()` with minimal payload (ID, type, summary)
3. Configure private channel auth for `App.Models.User.{id}`
4. Set up Echo `.notification()` listener in a persistent layout component
5. Verify real-time delivery without page refresh

### Detection Checklist
- [ ] `via()` does not include `'broadcast'`
- [ ] Users must refresh to see new notifications
- [ ] Broadcast notification channel not configured

### Related Rules
- (Rule: Always return `['database', 'broadcast']` in `via()` for dual delivery)

---

## Anti-Pattern 2: No Notification Pruning (Unbounded Table Growth)

### Category
Maintainability

### Description
Not implementing scheduled pruning of old read notifications, allowing the `notifications` table to grow unbounded and degrade query performance.

### Warning Signs
- `notifications` table size grows every day
- No scheduled task for deleting old notifications
- Notification queries become slower over weeks
- Database storage costs increase monthly

### Why It Is Harmful
Every notification creates a row in the `notifications` table. Over months, high-volume systems accumulate millions of rows. Queries for unread counts, notification lists, and mark-as-read operations degrade as the table grows. Indexes become less effective. Backup and restore times increase.

### Real-World Consequences
A social platform generates 50,000 notifications per day. After 6 months, the `notifications` table has 9 million rows. Loading the notification dropdown takes 3 seconds. Marking all as read takes 15 seconds. The database size increases backup time from 10 minutes to 45 minutes.

### Preferred Alternative
Schedule a daily command to delete read notifications older than a configurable threshold (e.g., 30 days).

### Refactoring Strategy
1. Create a scheduled command to prune notifications
2. Delete read notifications older than 30 days: `whereNotNull('read_at')->where('created_at', '<', now()->subDays(30))`
3. Run the command daily via `$schedule->command('notifications:prune')->daily()`
4. Monitor table size weekly until it stabilizes

### Detection Checklist
- [ ] No notification pruning scheduled
- [ ] Notifications table shows unbounded growth
- [ ] Notification queries degrading over time

### Related Rules
- (Rule: Always implement notification pruning)

---

## Anti-Pattern 3: Echo .notification() Listener in Page Component (Missed on Navigation)

### Category
Framework Usage

### Description
Placing Echo's `.notification()` listener inside a page component instead of a persistent layout component, causing the listener to be destroyed on navigation and notifications to be missed.

### Warning Signs
- `.notification()` listener in a component that mounts/unmounts on navigation
- Users miss notifications when navigating between pages
- Notification badge count incorrect after navigation
- Listener set up in page-level Vue/React component

### Why It Is Harmful
Page components are mounted when the user navigates to the page and destroyed when they leave. The `.notification()` listener is subscribed during mount and unsubscribed during destroy. If a notification arrives while the user is on a different page, the listener is not active and the notification is missed.

### Real-World Consequences
A user navigates from the dashboard to the settings page. During this time, a new order notification is broadcast. The settings page component does not have the `.notification()` listener. The notification is not displayed. The user returns to the dashboard and sees no new notification — but the database shows the notification exists.

### Preferred Alternative
Place the `.notification()` listener in a persistent layout component (app shell, sidebar, navbar) that survives navigation.

### Refactoring Strategy
1. Move the `.notification()` listener to the root layout/app component
2. Verify the listener stays active during client-side navigation
3. Test by broadcasting a notification and navigating between pages
4. Remove duplicate listeners from page-level components

### Detection Checklist
- [ ] `.notification()` listener in page-level component
- [ ] Notifications missed during navigation
- [ ] Badge counts inconsistent after navigation

### Related Rules
- (Rule: Always set up Echo `.notification()` listener in persistent components)

---

## Anti-Pattern 4: Shared Queue for Broadcast Notifications and Other Jobs

### Category
Performance

### Description
Routing broadcast notifications through the default queue connection shared with emails, report generation, and other job types, allowing a notification burst to block critical job processing.

### Warning Signs
- `BroadcastMessage` uses default queue
- Notifications share queue with emails and other jobs
- Email delivery delayed during notification bursts
- No `onQueue()` call on `BroadcastMessage`

### Why It Is Harmful
A burst of notifications (e.g., 10K users triggered at once) floods the default queue with `BroadcastEvent` jobs. Time-sensitive jobs like password reset emails, payment confirmations, or report exports are queued behind the notification backlog. Notifications are fire-and-forget; blocking critical jobs for notification delivery is unacceptable.

### Real-World Consequences
A marketing campaign sends notifications to 50,000 users simultaneously. The default queue fills with 50,000 broadcast jobs. Password reset emails are delayed by 20 minutes. Users report "forgot password not working" — but the issue is queue contention, not the password reset feature itself.

### Preferred Alternative
Use `BroadcastMessage::onQueue('notifications')` to route broadcast notifications to a dedicated queue connection.

### Refactoring Strategy
1. Update `toBroadcast()` to return `(new BroadcastMessage([...]))->onQueue('notifications')`
2. Create a dedicated queue worker: `php artisan queue:work --queue=notifications`
3. Configure Supervisor to keep the notifications worker running
4. Monitor notification queue backlog separately from other queues

### Detection Checklist
- [ ] BroadcastMessage uses default queue
- [ ] No dedicated queue for notifications
- [ ] Critical job delivery delayed during notification bursts

### Related Rules
- (Rule: Always configure a dedicated queue for broadcast notifications)

---

## Anti-Pattern 5: Full Object in Broadcast Notification Payload

### Category
Performance

### Description
Sending the complete notification data (including full related models) in the broadcast payload instead of a minimal structure, increasing WebSocket message size and serialization overhead.

### Warning Signs
- Broadcast payload contains full model data (e.g., entire order with items)
- WebSocket messages are large (>10KB)
- Serialization errors when models contain circular references
- `toBroadcast()` not defined separately from `toDatabase()`

### Why It Is Harmful
Broadcast notifications are delivered over WebSocket in real-time. Large payloads increase bandwidth per notification, slow serialization and deserialization, and increase the risk of serialization errors when models contain unloaded relations or circular references. The frontend typically only needs notification ID, type, and summary text.

### Real-World Consequences
A notification broadcasts the full order object including all items, customer details, and payment data — 50KB per notification. At 1000 notifications per minute, the WebSocket server pushes 50MB/min of notification data. The notification bell dropdown shows only the order ID and status — 95% of the payload is wasted bandwidth.

### Preferred Alternative
Define a separate `toBroadcast()` method that returns only the minimal payload: notification ID, type, summary text, and a reference ID for the frontend to fetch details if needed.

### Refactoring Strategy
1. Create `toBroadcast()` returning `new BroadcastMessage(['id' => $this->id, 'type' => 'order.shipped', 'summary' => "Order #{$id} shipped"])`
2. Keep full data in `toDatabase()` for persistent storage
3. Reduce broadcast payload size — frontend fetches full data via API on click
4. Verify payload size reduction in browser DevTools Network tab

### Detection Checklist
- [ ] Full model objects in broadcast payload
- [ ] Broadcast messages >10KB per notification
- [ ] `toBroadcast()` not defined — using `toArray()` for both channels

### Related Rules
- (Rule: Always use separate `toBroadcast()` and `toDatabase()` methods)
