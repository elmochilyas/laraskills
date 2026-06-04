# Metadata

**Domain:** real-time-systems
**Subdomain:** broadcasting-architecture
**Knowledge Unit:** model-broadcasting-broadcastsevents-trait
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `broadcastOn()` method is defined and returns appropriate channels
- [ ] `broadcastWith()` controls payload (not sending entire model)
- [ ] Broadcast is scoped to specific event types (not all CRUD operations)
- [ ] Always Define broadcastOn() When Using the BroadcastsEvents Trait
- [ ] Always Filter Event Types in broadcastOn() to Avoid Unnecessary Broadcasts
- [ ] Always Override broadcastWith() on Heavy Models
- [ ] Always Register Auth Callbacks for Auto-Generated Private Channels
- [ ] Avoid Model Broadcasting During Bulk Data Operations
- [ ] `broadcastOn()` is defined and returns appropriate channel instances
- [ ] `broadcastWith()` returns a minimal payload (not the entire model)
- [ ] Auth callback registered for auto-generated `App.Models.{ModelName}.{id}` pattern
- [ ] Add `use Illuminate\Database\Eloquent\BroadcastsEvents;` to the model
- [ ] Filter event types: return empty array for events that shouldn't broadcast
- [ ] Implement `broadcastOn(string $event): array` returning channels
- [ ] Bulk operations don't cause broadcast storms
- [ ] Model CRUD operations trigger real-time updates on frontend
- [ ] Only specified event types trigger broadcasts

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add `use Illuminate\Database\Eloquent\BroadcastsEvents;` to the model
- [ ] Filter event types: return empty array for events that shouldn't broadcast
- [ ] Implement `broadcastOn(string $event): array` returning channels
- [ ] On frontend, use `useEchoModel()` (framework hooks) or listen on the channel manually
- [ ] Override `broadcastAs(string $event)` for stable client-side event names
- [ ] Override `broadcastWith(string $event)` to control payload (avoid sending entire model)
- [ ] Register auth callbacks in `routes/channels.php` for auto-generated private channels
- [ ] Test: create, update, and delete a model instance and verify events arrive client-side
- [ ] Always Define broadcastOn() When Using the BroadcastsEvents Trait
- [ ] Always Filter Event Types in broadcastOn() to Avoid Unnecessary Broadcasts
- [ ] Always Override broadcastWith() on Heavy Models
- [ ] Always Register Auth Callbacks for Auto-Generated Private Channels

---

# Performance Checklist

- [ ] `Model::update()` bulk operations generate unexpected broadcastsâ€”be aware
- [ ] Heavy models with many attributes should override `broadcastWith()` to send minimal payloads
- [ ] Model broadcasting adds overhead to every Eloquent CRUD operation
- [ ] Queue-backed automaticallyâ€”HTTP response is not blocked
- [ ] Use `broadcastOn()` to selectively broadcast only specific event types
- [ ] Heavy models with many attributes should override `broadcastWith()` to send minimal payloads

---

# Security Checklist

- [ ] Auto-generated private channel names require matching auth callbacks
- [ ] Broadcasting within uncommitted transactions delivers incomplete data to clients
- [ ] Model serialization may expose attributes not intended for client consumption
- [ ] Returning the model instance from `broadcastOn()` creates a private channel, not public
- [ ] Model broadcasting fires on every Eloquent CRUD operation by defaultâ€”filter aggressively

---

# Reliability Checklist

- [ ] Broadcast storm on bulk update
- [ ] Entire model sent to clients
- [ ] No broadcasts emitted
- [ ] Subscriptions fail (403)
- [ ] Always Define broadcastOn() When Using the BroadcastsEvents Trait
- [ ] Always Filter Event Types in broadcastOn() to Avoid Unnecessary Broadcasts
- [ ] Always Override broadcastWith() on Heavy Models
- [ ] Always Register Auth Callbacks for Auto-Generated Private Channels
- [ ] Avoid Model Broadcasting During Bulk Data Operations
- [ ] Never Assume Returning a Model Creates a Public Channel

---

# Testing Checklist

- [ ] `broadcastOn()` is defined and returns appropriate channel instances
- [ ] `broadcastOn()` method is defined and returns appropriate channels
- [ ] `broadcastWith()` controls payload (not sending entire model)
- [ ] `broadcastWith()` returns a minimal payload (not the entire model)
- [ ] Auth callback registered for auto-generated `App.Models.{ModelName}.{id}` pattern
- [ ] Broadcast is scoped to specific event types (not all CRUD operations)
- [ ] Bulk operations (`Model::update()`) don't cause unexpected broadcast storms
- [ ] Bulk operations don't cause broadcast storms
- [ ] Channel auth callbacks are registered for auto-generated private channels
- [ ] Event types are filtered (not broadcasting all CRUD operations indiscriminately)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Model Broadcasting for Everything]
- [ ] [No broadcastWith() Override â€” Broadcasting Entire Model]
- [ ] [Broadcasting During Migrations/Seeding]
- [ ] [No Auth Callback for Auto-Generated Private Channels]
- [ ] [Assuming Returning Model Creates Public Channel]
- [ ] Assuming public auto-resolution
- [ ] Broadcasting during migrations/seeding
- [ ] Model broadcasting for everything
- [ ] No `broadcastWith()` override

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


