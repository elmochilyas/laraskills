# Metadata

**Domain:** real-time-systems
**Subdomain:** real-time-notifications
**Knowledge Unit:** real-time-notifications-broadcast-database
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `toBroadcast()` returns minimal payload (ID, type, summary)
- [ ] `toDatabase()` stores full notification data
- [ ] Batch mark-as-read handler implemented
- [ ] Always Configure a Dedicated Queue for Broadcast Notifications
- [ ] Always Configure Private Channel Auth for App.Models.User.{id}
- [ ] Always Implement Notification Pruning
- [ ] Always Return ['database', 'broadcast'] in via() for Dual Delivery
- [ ] Always Set Up Echo .notification() Listener in Persistent Components
- [ ] `toBroadcast()` returns minimal payload (ID, type, summary)
- [ ] `toDatabase()` stores full notification data
- [ ] `via()` returns `['database', 'broadcast']`
- [ ] Configure `BroadcastMessage::onQueue('notifications')` for dedicated queue routing
- [ ] Create a notification class: `php artisan make:notification OrderShipped`
- [ ] Handle duplicate delivery: online users get broadcast + fetch from DB on page load
- [ ] Notification badge count stays accurate across navigation
- [ ] Notifications table stays bounded via scheduled pruning
- [ ] Users can review past notifications when offline (database)

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure `BroadcastMessage::onQueue('notifications')` for dedicated queue routing
- [ ] Create a notification class: `php artisan make:notification OrderShipped`
- [ ] Handle duplicate delivery: online users get broadcast + fetch from DB on page load
- [ ] Implement `toBroadcast()` returning `BroadcastMessage` with minimal payload (ID, type, summary)
- [ ] Implement `toDatabase()` with full notification content
- [ ] Implement batch mark-as-read handler
- [ ] Place Echo `.notification()` listener in a persistent layout component (not a page component)
- [ ] Register auth callback for `App.Models.User.{id}` in `routes/channels.php`
- [ ] Return `['database', 'broadcast']` from the `via()` method
- [ ] Set up notification pruning: schedule cleanup of read notifications older than N days
- [ ] Always Configure a Dedicated Queue for Broadcast Notifications
- [ ] Always Configure Private Channel Auth for App.Models.User.{id}

---

# Performance Checklist

- [ ] Broadcast notification payload should be minimal (notification ID, type, summaryâ€”not full content)
- [ ] Database notifications insert into a single `notifications` tableâ€”index properly
- [ ] High-volume systems should use a dedicated queue connection
- [ ] Mark-as-read operations generate database writes; batch updates for marking multiple notifications
- [ ] Prune old notifications regularly
- [ ] Broadcast notification payloads should be minimal (ID, type, summary)â€”not full content
- [ ] Index `notifications` table on `notifiable_id` and `read_at` for query performance

---

# Security Checklist

- [ ] Broadcast notifications auto-target the user's private channel, ensuring only the intended user receives them
- [ ] Notification payloads may contain sensitive dataâ€”ensure broadcast payloads are minimal and database notifications are properly scoped
- [ ] Private channel auth must be properly configured in `routes/channels.php` to prevent unauthorized access
- [ ] Broadcast notifications auto-target the user's private channelâ€”ensure auth is configured

---

# Reliability Checklist

- [ ] Database grows unbounded
- [ ] Echo never receives `.notification()`
- [ ] No broadcast notifications received
- [ ] Notifications missed during navigation
- [ ] Notifications only arrive on page refresh
- [ ] Always Configure a Dedicated Queue for Broadcast Notifications
- [ ] Always Configure Private Channel Auth for App.Models.User.{id}
- [ ] Always Implement Notification Pruning
- [ ] Always Return ['database', 'broadcast'] in via() for Dual Delivery
- [ ] Always Set Up Echo .notification() Listener in Persistent Components

---

# Testing Checklist

- [ ] `toBroadcast()` returns minimal payload (ID, type, summary)
- [ ] `toDatabase()` stores full notification data
- [ ] `via()` returns `['database', 'broadcast']`
- [ ] Batch mark-as-read handler implemented
- [ ] Dedicated queue for broadcast notifications configured
- [ ] Echo `.notification()` listener in persistent component
- [ ] Echo `.notification()` listener set up in persistent component
- [ ] Notification badge count stays accurate across navigation
- [ ] Notification class has `via()` returning `['database', 'broadcast']`
- [ ] Notifications table stays bounded via scheduled pruning

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Database-Only Notifications When Real-Time Is Expected]
- [ ] [No Notification Pruning (Unbounded Table Growth)]
- [ ] [Echo .notification() Listener in Page Component (Missed on Navigation)]
- [ ] [Shared Queue for Broadcast Notifications and Other Jobs]
- [ ] [Full Object in Broadcast Notification Payload]
- [ ] Broadcast-only for critical notifications
- [ ] Not handling the duplicate delivery scenario
- [ ] Sending database-only notifications when real-time is expected
- [ ] Using the same database for notifications and application data without separation

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


