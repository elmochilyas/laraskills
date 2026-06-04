# Skill: Configure and Operate Laravel Broadcasting Architecture

## Purpose
Set up, configure, and maintain Laravel's broadcasting system for server-to-client real-time event delivery using the driver-based abstraction.

## When To Use
- Setting up broadcasting for the first time in a Laravel application
- Diagnosing silent broadcast failures or delivery issues
- Auditing an existing broadcasting configuration for security and performance
- Switching between broadcast drivers (Reverb, Pusher, Ably)

## When NOT To Use
- Server-to-server event systems (use queues directly)
- Applications that don't need real-time client updates
- Scenarios requiring guaranteed message delivery (broadcasting is fire-and-forget)

## Prerequisites
- Laravel application with queue worker configured
- WebSocket server (Reverb, Pusher, or Ably) accessible
- Frontend application with Echo installed

## Inputs
- `.env` broadcast variables (`BROADCAST_CONNECTION`, `REVERB_*`, `PUSHER_*`)
- `config/broadcasting.php`
- Event classes implementing `ShouldBroadcast`
- `routes/channels.php` with authorization callbacks

## Workflow
1. Run `php artisan install:broadcasting` to scaffold configuration
2. Set `BROADCAST_CONNECTION` and driver credentials in `.env`
3. Configure `config/broadcasting.php` with driver-specific options
4. Ensure a queue worker is running (`php artisan queue:work`)
5. Create event classes implementing `ShouldBroadcast` with `broadcastOn()`
6. Register `Broadcast::routes()` with auth and rate-limit middleware in `routes/channels.php`
7. Define channel authorization callbacks for private and presence channels
8. Configure Echo on the frontend with matching broadcaster and credentials
9. Set `allowed_origins` in Reverb config for CSWSH prevention
10. Verify: dispatch a test event and confirm client receives it

## Validation Checklist
- [ ] `BROADCAST_CONNECTION` is correctly set (not `log` or `null` in production)
- [ ] Queue worker is running on the `broadcasts` queue
- [ ] `Broadcast::routes()` has auth middleware applied
- [ ] `allowed_origins` is a non-empty array in production
- [ ] Echo client connects and receives events on the expected channel

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Events never received by clients | Queue worker not running | Check `php artisan queue:status` |
| Auth endpoint returns 404 | `Broadcast::routes()` not registered | Verify it's called in `routes/channels.php` |
| Echo connection fails | Missing `pusher-js` dependency | Check NPM dependencies for `pusher-js` |
| Private channel subscriptions fail | No auth callback registered | Check `routes/channels.php` for matching pattern |

## Decision Points
- **Driver selection**: Use Reverb for self-hosted, Pusher/Ably for managed infrastructure
- **`ShouldBroadcastNow` vs queued**: Reserve synchronous dispatch for latency-critical events only
- **Dedicated queue**: Use `broadcastQueue()` to isolate broadcasts from other job types

## Performance/Security Considerations
- Dedicated queue connection prevents broadcast backlog from starving other jobs
- `toOthers()` with `X-Socket-ID` prevents sender from receiving redundant updates
- Auth endpoint must be rate-limited to prevent abuse during reconnection storms
- `broadcastWith()` controls payload to avoid leaking sensitive model data

## Related Rules (from 05-rules.md)
- Always Run a Queue Worker for Broadcast Events
- Configure a Dedicated Queue Connection for Broadcasts
- Always Apply Auth Middleware and Rate Limiting to `Broadcast::routes()`
- Use `ShouldDispatchAfterCommit` for Transaction-Dependent Broadcasts
- Always Use `toOthers()` with `X-Socket-ID` for Sender Exclusion

## Related Skills
- Create and Customize ShouldBroadcast Events
- Configure Echo for Frontend Subscriptions
- Set Up Reverb for Self-Hosted WebSocket

## Success Criteria
- Echo client receives real-time events on subscribed channels
- Queue worker processes broadcast events without backlog
- Auth endpoint responds <50ms under normal load
- All private/presence channels enforce authorization correctly
