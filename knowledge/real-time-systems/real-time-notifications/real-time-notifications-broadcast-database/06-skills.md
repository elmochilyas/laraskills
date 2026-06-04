# Skill: Set Up Real-Time Notifications with Broadcast + Database

## Purpose
Implement dual-channel notifications using both broadcast (real-time WebSocket) and database (persistent storage) for instant delivery with reliable persistence.

## When To Use
- User notification bell UI with real-time badge counter
- Order status notifications needing both instant delivery and persistent history
- Social features (friend requests, likes, comment notifications)
- Any scenario where both immediacy and reliability are important

## When NOT To Use
- High-frequency notifications that would flood the database (use broadcast-only)
- Notifications requiring guaranteed delivery (broadcast is fire-and-forget)
- Features where only real-time or only persistent is needed

## Prerequisites
- Notification system configured in Laravel
- Broadcasting set up with queue worker running
- Private channel auth configured for `App.Models.User.{id}` in routes/channels.php
- Echo configured on the frontend

## Inputs
- Notification class with `via()`, `toBroadcast()`, `toDatabase()` methods
- Echo `.notification()` listener on frontend
- Notification pruning schedule

## Workflow
1. Create a notification class: `php artisan make:notification OrderShipped`
2. Return `['database', 'broadcast']` from the `via()` method
3. Implement `toBroadcast()` returning `BroadcastMessage` with minimal payload (ID, type, summary)
4. Implement `toDatabase()` with full notification content
5. Register auth callback for `App.Models.User.{id}` in `routes/channels.php`
6. Place Echo `.notification()` listener in a persistent layout component (not a page component)
7. Set up notification pruning: schedule cleanup of read notifications older than N days
8. Configure `BroadcastMessage::onQueue('notifications')` for dedicated queue routing
9. Handle duplicate delivery: online users get broadcast + fetch from DB on page load
10. Implement batch mark-as-read handler

## Validation Checklist
- [ ] `via()` returns `['database', 'broadcast']`
- [ ] `toBroadcast()` returns minimal payload (ID, type, summary)
- [ ] `toDatabase()` stores full notification data
- [ ] Private channel auth configured for `App.Models.User.{id}` in channels.php
- [ ] Echo `.notification()` listener in persistent component
- [ ] Scheduled task for pruning old notifications
- [ ] Batch mark-as-read handler implemented
- [ ] Dedicated queue for broadcast notifications configured

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| No broadcast notifications received | Missing `'broadcast'` in `via()` | Add `'broadcast'` to the returned array |
| Notifications only arrive on page refresh | Only `'database'` in `via()` | Add `'broadcast'` for real-time delivery |
| Echo never receives `.notification()` | No auth for `App.Models.User.{id}` channel | Register callback in `routes/channels.php` |
| Notifications missed during navigation | Listener in page component (unmounts) | Move to persistent layout component |
| Database grows unbounded | No notification pruning | Schedule pruning of old read notifications |

## Decision Points
- **Separate `toBroadcast()` and `toDatabase()`**: Broadcast payloads should be minimal (ID, type, summary); database can store full content
- **Dedicated queue**: Use `BroadcastMessage::onQueue('notifications')` to isolate notification broadcasts from other jobs
- **Pruning threshold**: 30 days is standard for read notifications; adjust based on compliance requirements

## Performance/Security Considerations
- Broadcast notification payloads should be minimal (ID, type, summary)—not full content
- Index `notifications` table on `notifiable_id` and `read_at` for query performance
- Schedule daily pruning of read notifications to prevent unbounded table growth
- Broadcast notifications auto-target the user's private channel—ensure auth is configured

## Related Rules (from 05-rules.md)
- Always Return `['database', 'broadcast']` in `via()` for Dual Delivery
- Always Use Separate `toBroadcast()` and `toDatabase()` Methods
- Always Configure Private Channel Auth for `App.Models.User.{id}`
- Always Implement Notification Pruning
- Always Set Up Echo `.notification()` Listener in Persistent Components
- Always Configure a Dedicated Queue for Broadcast Notifications

## Related Skills
- Architect Real-Time Dashboards with Metric Broadcasting
- Configure Echo Core API for Frontend Subscriptions

## Success Criteria
- Users receive notifications instantly when online (broadcast)
- Users can review past notifications when offline (database)
- Notifications table stays bounded via scheduled pruning
- Notification badge count stays accurate across navigation
