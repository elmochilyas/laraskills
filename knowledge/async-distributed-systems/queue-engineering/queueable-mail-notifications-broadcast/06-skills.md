# Skill: Configure Queueable Mail, Notifications, and Broadcast Events

## Purpose
Configure mail, notifications, and broadcast events to use the queue correctly — avoiding single-job bottlenecks, timeout issues, and real-time delays.

## When To Use
When sending production mail, sending multi-channel notifications, or broadcasting real-time events.

## When NOT To Use
Development/testing environments where synchronous processing is simpler; database-only notifications that are inherently synchronous.

## Prerequisites
- Queue connection configured (Redis, SQS, etc.)
- Worker processes running
- Mailable, notification, or event classes created

## Inputs
- Notification type (mail, SMS, database, broadcast)
- Channel count and expected latency per channel
- Real-time criticality of broadcast events

## Workflow
1. For mail: use `Mail::queue()` not `Mail::send()` in production
2. For notifications with multiple channels: separate into individual notifications per channel
3. Set `$timeout` on mailables with large attachments: `public $timeout = 60`
4. For real-time events: use `ShouldBroadcastNow` instead of `ShouldBroadcast`
5. Configure per-type queue routing: set `$connection` and `$queue` on mailables/notifications
6. Verify single-channel notifications run as separate parallel jobs

## Validation Checklist
- [ ] `Mail::queue()` used in all production mail paths
- [ ] Multi-channel notifications separated into individual classes
- [ ] `$timeout` set on mailables (30-60s)
- [ ] `ShouldBroadcastNow` used for user-facing real-time events
- [ ] Queue routing configured per type (mail, notifications, broadcast)
- [ ] Mail delivery confirmed via worker logs

## Common Failures
- Multiple notification channels in one job — slow channel blocks all others
- No `$timeout` on mailable — job times out on slow SMTP relay
- `ShouldBroadcast` for real-time events — broadcast delayed by queue backlog
- `Mail::send()` in production — blocks HTTP response for SMTP latency

## Decision Points
- Real-time events: `ShouldBroadcastNow` (immediate) vs `ShouldBroadcast` (queued)
- Multi-channel: single notification class (sequential) vs separate classes (parallel)

## Performance Considerations
- Single notification with 3 channels: total time = mail + SMS + database (sequential)
- Separate channels run in parallel across different workers
- Broadcast via queue adds worker polling delay

## Security Considerations
- Queue mail to avoid response-time information leaks from SMTP latency
- `$timeout` prevents worker lockup on unresponsive SMTP servers

## Related Rules
- Rule 1: dont-assume-multiple-channel-jobs
- Rule 2: set-mailable-timeout-explicitly
- Rule 3: prefer-broadcast-now-for-realtime
- Rule 4: always-queue-mail-production
- Rule 5: separate-notification-channels

## Related Skills
- Test Job Dispatch Behavior with Queue::fake()
- Configure Job --timeout and retry_after

## Success Criteria
Mail dispatches asynchronously via queue, multi-channel notifications run as independent parallel jobs, real-time broadcasts reach clients immediately, and no timeout failures occur from slow external services.
