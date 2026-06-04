# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Engineering
Knowledge Unit: Queueable Mail, Notifications, and Broadcast Events
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Beyond explicit job classes, Laravel supports queuing for mail, notifications, and broadcast events — each through a different internal mechanism but all sharing the same underlying queue infrastructure. Mail becomes a `SendMail` job, notifications become a `SendQueuedNotifications` job, and broadcast events become a `CallQueuedBroadcast` job. Understanding these wrappers is critical because each has distinct serialization behavior, queue configuration paths, and failure modes. A notification with multiple channels doesn't create multiple jobs — it creates one job that processes all channels sequentially, which has significant performance implications.

# Core Concepts
- **Queued mail**: `Mail::queue(new Mailable)` wraps the mailable in an `Illuminate\Mail\SendMail` job. The mailable is serialized with `SerializesModels` automatically.
- **Queued notifications**: `Notification::send($users, new Notification)` creates a `SendQueuedNotifications` job that iterates over channels and dispatches each.
- **Broadcast events**: Events implementing `ShouldBroadcast` are wrapped in a `CallQueuedBroadcast` job that serializes the event for the broadcasting system.
- **Per-type queue configuration**: Mailables use `$connection` and `$queue` properties. Notifications use `$connection` and `$queue` on the notification class. Broadcast events configure via the event's `broadcastOn()`.
- **Channel-dependent queuing**: For notifications, some channels (mail, broadcast via `ShouldBroadcast`) queue automatically. Others (database, SMS via Nexmo) process immediately.

# Mental Models
- **Wrapped gift**: Each queueable type is a different gift (mail, notification, broadcast event) but they're all wrapped in the same gift box (the job wrapper) before being placed on the queue.
- **One envelope per type**: Multiple notification channels don't mean multiple jobs — the notification is one envelope that the notification channel processes all together.

# Internal Mechanics
- `Mail::queue($mailable)` calls `$mailable->send($this)` wrapped in `new SendMail($mailable)` via `dispatch()`.
- `SendMail` extends `Job` and implements `ShouldQueue`. It re-hydrates the mailable in `handle()` and calls `$mailer->send($mailable)`.
- `SendQueuedNotifications` wraps the notification, recipients, and channels. In `handle()`, it iterates each channel: `$channel->send($notifiables, $notification)`.
- `CallQueuedBroadcast` wraps the broadcast event. In `handle()`, it dispatches the event payload to the broadcasting manager.
- The `$afterCommit` property on each type controls whether dispatch waits for transaction commit.

# Patterns
## Notification Channel Separation
- **Purpose**: Process channels independently for faster notification delivery.
- **Benefit**: A slow push notification doesn't block email dispatch.
- **Tradeoff**: Multiple jobs per notification; more queue operations.

## Mailable Throttling
- **Purpose**: Rate-limit mail delivery to avoid SMTP provider limits.
- **Benefit**: Stay within SendGrid/Mailgun sending limits.
- **Tradeoff**: Adds latency; must track rate limit state across servers.

## Conditional Broadcasting
- **Purpose**: Broadcast immediately for high-priority events, queue for others.
- **Benefit**: Users see real-time updates for critical events.
- **Tradeoff**: Mixed execution model; synchronous broadcasts block.

# Architectural Decisions
- **When to queue mail**: Always queue mail in production. SMTP calls are network-bound and unpredictable. Only use synchronous mail for password-reset flows where immediate delivery is required.
- **When to queue notifications**: Queue notifications that use external channels (mail, SMS, push). Database notifications can be synchronous.
- **When to broadcast immediately**: Use `ShouldBroadcastNow` for events that need real-time delivery (chat messages, live updates). Use `ShouldBroadcast` for non-critical events.

# Tradeoffs
Queued mail | Non-blocking request, retry capability | Delayed delivery; user refreshes before email arrives
Queued notification (single job) | One job per notification, fewer queue operations | Slow channel blocks fast channel; no parallelism
Broadcast via ShouldBroadcast | Async broadcast does not block request | Broadcast is delayed until worker processes

# Performance Considerations
- A single `SendQueuedNotifications` job processing 3 channels (mail, SMS, database) takes time = mail + SMS + database. Each channel is sequential.
- For high-volume notifications (newsletter to 10K users), batch the dispatch. A single job can timeout processing 10K notifications.
- Queued mailables are serialized — if the mailable contains large datasets (tables, charts), serialization size impacts Redis/SQS memory.

# Production Considerations
- Set `$timeout` on mailables/notifications appropriately. A mailable that connects to an SMTP relay needs 30-60s timeout.
- Monitor notification failure rate separately from job failure rate — a notification may fail on one channel but succeed on others.
- Broadcast event payloads go through two serializations: the job queue and the broadcasting driver. Ensure payloads fit both.

# Common Mistakes
- **Assuming multiple channels = multiple jobs**: `SendQueuedNotifications` executes all channels in one job. If one channel times out, the entire notification fails.
- **Not setting `$timeout` on queueable mailables**: The default timeout may be too short for SMTP with large attachments or slow relays.
- **Forgetting `ShouldBroadcastNow` for real-time needs**: `ShouldBroadcast` creates a queue job — broadcast happens on the next worker tick, introducing unpredictable delay.

# Failure Modes
- **Notification partially fails**: The job wraps all channels. If the mail channel succeeds but the SMS channel fails, the entire job fails. The mail was already sent but will be re-sent on retry.
- **Mailable serialization failure**: If the mailable contains non-serializable data (e.g., a builder instance, a resource), the job fails at dispatch, not at processing.
- **Broadcast queue delay**: `ShouldBroadcast` jobs may sit in the queue for seconds, defeating the purpose of "real-time." Unexpected if workers are busy with other jobs.

# Ecosystem Usage
- **Laravel Horizon**: Shows `SendMail`, `SendQueuedNotifications`, and `CallQueuedBroadcast` as job types in the dashboard.
- **Laravel Pulse**: Tracks execution time for all queueable types — slow mailable processing shows up in SlowJobs.
- **Spatie packages**: Use explicit jobs for webhook dispatch rather than queueable types.

# Related Knowledge Units
- K006 ShouldQueue Contract and Queueable Types (contract mechanics) | K028 Queued Event Listeners (similar pattern for events)

## Research Notes
- The Queue::route() method introduced in Laravel 11 allows mapping job classes to specific connection/queue combinations at dispatch time, evaluated lazily — this changes the mental model from dispatch-time resolution to routing-time resolution.
- Laravel 12 introduced the ailover connection driver for queue HA, but automatic failback is not supported — the primary connection must be manually restored after it recovers.
- The fter_commit option has different behavior across drivers: Redis queues honor it via transaction callbacks; SQS queues rely on the fter_commit config key at the connection level.
- Octane compatibility for queue dispatching is an ongoing concern — the QueueManager is resolved from the container and may hold stale references between requests in persistent application contexts.
- Serializing models for queued jobs uses ModelIdentifier under the hood — the trait SerializesModels handles this by converting model instances to identifiers before serialization and rehydrating them after unserialization.
- Community benchmarks show Redis queue throughput of 10,000+ jobs/second with Horizon, while SQS throughput is limited by API rate limits (3,000 messages/second per account per region initially).
