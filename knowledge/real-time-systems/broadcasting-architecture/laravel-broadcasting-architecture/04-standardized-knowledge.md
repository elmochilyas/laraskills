# Standardized Knowledge: Laravel Broadcasting Architecture

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | Event Broadcasting Architecture |
| Knowledge Unit ID | K01 |
| Knowledge Unit | Laravel Broadcasting Architecture |
| Difficulty | Foundation |
| Maturity | Stable |
| Confidence | High |
| Last Updated | 2026-06-02 |

## Overview

Laravel's broadcasting system enables server-side events to be pushed to client-side JavaScript applications via WebSocket connections using a driver-based abstraction. It separates event dispatch (Laravel core), transport (broadcast drivers), and client consumption (Laravel Echo). The architecture is queue-native—all broadcast events are pushed through the queue system so that HTTP response times are not impacted by WebSocket delivery. The system supports three channel types (public, private, presence) and multiple backend drivers. Configuration lives in `config/broadcasting.php`.

## Core Concepts

The broadcasting architecture is layered: Application → Event Dispatch → Queue → Broadcast Driver → WebSocket Server → Echo Client. Events are standard Laravel event classes implementing `ShouldBroadcast`, which signals the framework to queue them for broadcast. The `BroadcastManager` resolves the configured driver and handles event serialization and publishing. The `PendingBroadcast` class provides a fluent API for dispatching broadcasts, including `toOthers()` for sender exclusion via `X-Socket-ID`.

## When To Use

- Any Laravel application needing real-time server-to-client event push
- Chat applications, live dashboards, notifications
- Collaborative features requiring real-time updates
- Applications using Laravel Echo on the frontend

## When NOT To Use

- Server-to-server event systems (use queues directly)
- Applications not needing real-time client updates
- Systems requiring guaranteed message delivery (broadcasting is fire-and-forget)
- Scenarios where client pushback is needed (use WebSocket directly)

## Best Practices (WHY)

- **Always run a queue worker**: Broadcasting requires a running queue worker for event dispatch
- **Driver abstraction**: All broadcast drivers implement the same contract; switching from Reverb to Pusher requires only a config change
- **Queue-backed by default**: Synchronous broadcasting blocks HTTP responses; queueing ensures responsiveness
- **Pusher protocol as standard**: Reverb and Soketi implement the Pusher protocol, making Echo compatible across all options
- **Monitor queue backlog**: Use Horizon or Pulse to track broadcast job backlog

## Architecture Guidelines

- All broadcasts go through the queue by default (except `ShouldBroadcastNow`)
- The `BroadcastEvent` job wraps broadcast logic with retry, failure handling, and monitoring
- Drivers abstract the underlying WebSocket protocol; switching providers requires config change only
- Channel separation maps to different authorization requirements
- `toOthers()` combined with `X-Socket-ID` header prevents redundant updates

## Performance Considerations

- Queue worker count must match broadcast dispatch volume
- Event payload size directly impacts serialization and network transfer
- `ShouldBroadcastNow` bypasses queue—use only for latency-critical events
- `sync` queue driver for broadcasting negates performance benefit; development only
- Dedicated queue connection for broadcasts prevents other job types from starving throughput

## Security Considerations

- Configure `Broadcast::routes()` with proper middleware (auth guards, rate limiting)
- Set `allowed_origins` in Reverb config to prevent unauthorized domain connections
- Use `after_commit` or `ShouldDispatchAfterCommit` for transactional consistency
- Implement `ShouldRescue` on events to prevent broadcast failures from surfacing to users
- Auth endpoint must be rate-limited to prevent abuse

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Forgetting to start queue worker | Setup omission | Broadcasts silently never deliver | Always verify queue worker is running |
| Synchronous broadcast dispatch | Using `ShouldBroadcastNow` excessively | HTTP response time degraded | Use default queued broadcasting |
| Not implementing `broadcastWith()` | Public properties auto-serialize | Exposes internal objects or sensitive data | Override `broadcastWith()` to control payload |
| Broadcasting on public channels when auth needed | Wrong channel type | Unauthorized clients receive sensitive data | Use private/presence channels for authorized data |
| Broadcast::routes() without auth middleware | Missing middleware config | Unauthenticated users can access auth endpoint | Add auth middleware to broadcast routes |

## Anti-Patterns

- **Synchronous broadcasting for all events**: Blocking HTTP responses for every broadcast
- **Mixing broadcast and non-broadcast queue jobs**: Broadcast backlog starves other job types
- **No queue worker monitoring**: Silent failures when queue worker dies
- **Hardcoded broadcast driver in code**: Instead of using `config/broadcasting.php` env-driven selection

## Examples

```php
// config/broadcasting.php
'default' => env('BROADCAST_CONNECTION', 'reverb'),

'connections' => [
    'reverb' => [
        'driver' => 'reverb',
        'key' => env('REVERB_APP_KEY'),
        'secret' => env('REVERB_APP_SECRET'),
        'app_id' => env('REVERB_APP_ID'),
        'options' => [
            'host' => env('REVERB_HOST'),
            'port' => env('REVERB_PORT'),
        ],
    ],
],
```

## Related Topics

- K02: ShouldBroadcast Interface & Event Lifecycle
- K30: Model Broadcasting (BroadcastsEvents Trait)
- K18: WebSocket vs SSE vs Polling Decision Framework
- K11: Public/Private/Presence Channel Patterns
- K12: Channel Authorization (routes/channels.php)

## AI Agent Notes

- Broadcasting architecture has remained stable across Laravel 11.x, 12.x, and 13.x
- The primary evolution has been server-side drivers (Reverb becoming default), not the broadcasting abstraction
- Laravel 13 introduced the database scaling driver for Reverb, transparent to the broadcasting layer
- The `BroadcastEvent` job and `BroadcastManager` use `SerializesModels` trait for safe Eloquent serialization

## Verification

- [ ] Broadcasting driver is correctly configured in `config/broadcasting.php`
- [ ] Queue worker is running to process broadcast events
- [ ] `Broadcast::routes()` is registered with appropriate middleware
- [ ] `allowed_origins` is configured for WebSocket server
- [ ] Broadcast events use `ShouldBroadcast` interface
- [ ] Channel authorization is configured in `routes/channels.php`
- [ ] Echo is properly configured on the frontend
- [ ] `toOthers()` sender exclusion works correctly
