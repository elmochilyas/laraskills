# Skill: Implement `ShouldBroadcast` for Real-Time Events

## Purpose
Implement `ShouldBroadcast` on event classes to push real-time updates to connected WebSocket clients via the broadcasting system.

## When To Use
Real-time UI features (new orders, notifications, chat, live feeds); collaborative features (typing indicators, shared documents); live dashboards and monitoring.

## When NOT To Use
Non-real-time features tolerating seconds of delay (use queue jobs); server-to-server communication (use queues/message brokers); features needing guaranteed delivery with persistence; mobile/CLI clients (Echo is browser-focused).

## Prerequisites
- Broadcasting driver configured (Reverb, Pusher, Ably)
- `routes/channels.php` set up for auth callbacks
- Echo installed on frontend (if using browser)

## Inputs
- Event class with serializable properties
- Channel type (public, private, presence)
- Queue vs immediate delivery decision

## Workflow
1. Implement `ShouldBroadcast` on event class
2. Define `broadcastOn()` returning `[new PrivateChannel('orders.'.$this->orderId)]`
3. Keep payload minimal — send IDs, not full models
4. Use `broadcastAs()` to set custom event name
5. For time-sensitive events: use `ShouldBroadcastNow` instead
6. Use private channels for user-specific data, public for announcements
7. Monitor broadcast queue backlog — worker saturation delays delivery
8. Register channel auth callbacks in `routes/channels.php`

## Validation Checklist
- [ ] `ShouldBroadcast` implemented on event class
- [ ] `broadcastOn()` returns correct channel type (private for user data)
- [ ] Payload minimal — IDs, not full model serializations
- [ ] `broadcastAs()` matches Echo `listen()` event name
- [ ] `ShouldBroadcastNow` used for time-sensitive events
- [ ] Channel auth callbacks in `routes/channels.php`
- [ ] No sensitive data on public channels
- [ ] Broadcast queue backlog monitored

## Common Failures
- Broadcasting all events — unnecessary queue load
- Not using `ShouldBroadcastNow` for time-sensitive events — delivery delay
- Public channels for user data — any client can intercept
- Large payloads — increased latency and bandwidth

## Decision Points
- Time-sensitive (chat, cursors): `ShouldBroadcastNow`
- Tolerant of delay (analytics): `ShouldBroadcast` (queued)
- User-specific: `PrivateChannel`
- Anonymous: Public channel

## Related Rules
- Rule 1: keep-broadcast-payloads-minimal
- Rule 2: use-broadcast-now-for-realtime
- Rule 3: never-broadcast-sensitive-data-public
- Rule 4: monitor-broadcast-queue-backlog

## Related Skills
- Configure Channel Types — Public, Private, Presence
- Set Up Laravel Echo Client-Side Consumption
- Deploy Reverb to Production

## Success Criteria
Broadcast events use minimal payloads, user data goes through private channels, time-sensitive events bypass the queue, and broadcast backlog is monitored.
