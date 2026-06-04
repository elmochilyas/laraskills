# Anti-Patterns: Queueable Mail, Notifications, and Broadcast Events

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering |
| Knowledge Unit | K085 — Queueable Mail, Notifications, and Broadcast Events |
| Classification | Intermediate |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Assuming Multiple Notification Channels = Multiple Jobs | Design | High |
| 2 | Missing $timeout on Queueable Mailables | Reliability | High |
| 3 | ShouldBroadcast for Real-Time Events | Performance | High |
| 4 | Mail::send() in Production | Performance | Critical |
| 5 | Single Notification for Mixed-Speed Channels | Performance | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| No Queue Routing for Mail/Notifications/Broadcast | queueable-mail-notifications-broadcast, queue-connections-vs-queues | Medium |
| Mixing Sync and Queue Mail Without Clear Pattern | queueable-mail-notifications-broadcast, should-queue-contract | Medium |
| Broadcast Payloads with Full Model Serialization | queueable-mail-notifications-broadcast, job-serialization-payload-envelope | High |

---

## Anti-Pattern 1: Assuming Multiple Notification Channels = Multiple Jobs

### Category
Design — Sequential Blocking

### Description
Assuming that a notification with multiple channels (e.g., mail + SMS + database) creates multiple parallel jobs. In reality, `SendQueuedNotifications` processes all channels sequentially in a single job — one slow channel blocks all others.

### Why It Happens
The default behavior is not obvious from the API. Developers naturally assume that multiple channels mean multiple jobs, like separate dispatches. The single-job implementation is an internal detail that surprises most developers.

### Warning Signs
- Notification class defines multiple channels in `via()` but channels are dispatched to different workers
- Slow channel (e.g., SMS via external API) delays faster channels (email, database)
- Single notification timeout causes all channels to fail and retry
- Team expresses surprise that channels don't run in parallel
- Notification processing time = sum of all channel times

### Why Harmful
A slow external service (SMS provider, push notification service) delays every other channel. An SMS that takes 10 seconds adds 10 seconds to email delivery — users wait longer for critical emails. If the slow channel times out, the entire notification fails and retries, including channels that already succeeded.

### Real-World Consequences
A `WelcomeNotification` sends mail (2s), SMS (12s via slow provider), and database (0.1s). Total job time: 14.1s. The 2s mail delivery is delayed by the 12s SMS call. Users receive the welcome email 12 seconds later than necessary. When the SMS provider has an outage, the entire notification fails — including the email and database channels that would have worked fine.

### Preferred Alternative
Separate each channel into its own notification class dispatched independently.

### Refactoring Strategy
1. Create individual notification classes per channel: `WelcomeMail`, `WelcomeSms`, `WelcomeDatabase`
2. Dispatch each separately: `$user->notify(new WelcomeMail); $user->notify(new WelcomeSms);`
3. Configure independent timeouts per channel
4. Handle failures independently per channel
5. Monitor per-channel delivery latency

### Detection Checklist
- [ ] Single notification class with multiple channels in `via()`
- [ ] Notification processing time = sum of all channels
- [ ] Slow external channel delays internal channels
- [ ] Team expects parallel execution

### Related Rules/Skills/Decision Trees
- **Rule 1**: dont-assume-multiple-channel-jobs (`05-rules.md`)
- **Rule 5**: separate-notification-channels (`05-rules.md`)
- **Decision 1**: Single Notification Job vs Separate Jobs per Channel (`07-decision-trees.md`)

---

## Anti-Pattern 2: Missing $timeout on Queueable Mailables

### Category
Reliability — Timeout Failure

### Description
Failing to set `$timeout` explicitly on queueable mailables. The default timeout (60s) may be insufficient for mail with large attachments or slow SMTP relays — the job times out before the email sends, and the recipient never receives it.

### Why It Happens
Developers don't anticipate slow SMTP connections. The default 60s timeout seems generous, but SMTP with 5MB attachments, connection retries, and slow relays can easily exceed it.

### Warning Signs
- Mailable class has no `$timeout` property (default 60s)
- Mail jobs time out in production during peak hours
- SMTP relay logs show response times > 30s
- Mailables with attachments
- "Mailable timeout" errors in failed_jobs table

### Why Harmful
The mail job times out, fails, and enters `failed_jobs`. The email is never sent. Depending on the retry configuration and whether the failure is permanent, the recipient may never receive critical communications.

### Real-World Consequences
A monthly invoice PDF is 8MB. The `InvoiceMail` mailable has no `$timeout` (defaults to 60s). SMTP upload takes 75s. The job times out at 60s, goes to `failed_jobs`, and the scheduled retry also times out. After 5 retries, the job is permanently failed. The customer never receives their invoice, and the finance team must manually send it.

### Preferred Alternative
Always set `$timeout` explicitly on mailables, especially those with attachments. Set to 60-120s depending on attachment size.

### Refactoring Strategy
1. Add `public $timeout = 60;` to all mailable classes
2. For mail with attachments, set `$timeout = 120;` or higher
3. Ensure `retry_after` in queue config is greater than `$timeout`
4. Test with actual attachment sizes in staging
5. Monitor mail delivery success rates

### Detection Checklist
- [ ] Mailable lacks `$timeout` property
- [ ] Mail jobs time out in production
- [ ] Mailables have attachments
- [ ] SMTP relay is external (non-local)

### Related Rules/Skills/Decision Trees
- **Rule 2**: set-mailable-timeout-explicitly (`05-rules.md`)
- **Decision 1**: Single Notification Job vs Separate Jobs per Channel (`07-decision-trees.md`)

---

## Anti-Pattern 3: ShouldBroadcast for Real-Time Events

### Category
Performance — Real-Time Latency

### Description
Using `ShouldBroadcast` (queued) for user-facing real-time events like chat messages, cursor positions, or live score updates. The queue introduces unpredictable delay (1-5 seconds) as the worker polls for new jobs.

### Why It Happens
Developers use `ShouldBroadcast` by default without considering the time sensitivity of the event. The difference between `ShouldBroadcast` and `ShouldBroadcastNow` is not immediately obvious, and defaulting to queued seems safer.

### Warning Signs
- Chat messages, live cursors, or collaborative editing use `ShouldBroadcast`
- Broadcast events reach clients with 1-5 second delay
- Users complain about lag in real-time features
- Broadcast delay correlates with queue backlog depth
- No `ShouldBroadcastNow` used in the application

### Why Harmful
Real-time features feel slow to users. A chat message that takes 3 seconds to appear is a poor user experience. For collaborative editing or live cursors, queued broadcast makes the feature unusable.

### Real-World Consequences
A team builds a live chat feature using `ShouldBroadcast`. Messages take 2-5 seconds to appear on the recipient's screen. Users report that the chat feels like email — slow and unresponsive. After switching to `ShouldBroadcastNow`, messages appear in under 200ms, and user satisfaction improves dramatically.

### Preferred Alternative
Use `ShouldBroadcastNow` for user-facing real-time events (chat, cursors, live updates). Reserve `ShouldBroadcast` for non-critical events (activity feeds, analytics).

### Refactoring Strategy
1. Identify broadcast events used for real-time features
2. Change `implements ShouldBroadcast` to `implements ShouldBroadcastNow`
3. Test broadcast latency before and after
4. Keep `ShouldBroadcast` for non-critical events (notifications sidebar, feed updates)
5. Document the distinction for future event classes

### Detection Checklist
- [ ] `ShouldBroadcast` used for chat/messaging events
- [ ] Broadcast delay noticeable to users
- [ ] No `ShouldBroadcastNow` in codebase
- [ ] Real-time features feel slow

### Related Rules/Skills/Decision Trees
- **Rule 3**: prefer-broadcast-now-for-realtime (`05-rules.md`)
- **Decision 2**: ShouldBroadcast vs ShouldBroadcastNow Selection (`07-decision-trees.md`)

---

## Anti-Pattern 4: Mail::send() in Production

### Category
Performance — Blocking HTTP Response

### Description
Using `Mail::send()` instead of `Mail::queue()` in production. The synchronous SMTP call blocks the HTTP request, adding unpredictable network latency to every response that sends email.

### Why It Happens
Development habits — `Mail::send()` works fine in local environments where SMTP is instant or faked. The pattern carries over to production. Teams forget to switch to `Mail::queue()` in deployment scripts.

### Warning Signs
- `Mail::send()` in production code paths
- Email-sending routes show correlated latency with SMTP relay
- HTTP response times spike on registration, order confirmation routes
- No queue worker processing mail jobs
- SMTP timeout in HTTP response

### Why Harmful
SMTP calls are network-bound and unpredictable — a slow relay adds 5-30 seconds to response times. At peak traffic, synchronous mail compounds delays, reducing throughput and causing user-facing timeouts.

### Real-World Consequences
An e-commerce site sends order confirmation emails via `Mail::send()` during checkout. SMTP relay has intermittent 8-second delays. During a flash sale, 50% of checkout requests time out because the SMTP call blocks the response. Conversion drops by 20% as users abandon slow checkout.

### Preferred Alternative
Always use `Mail::queue()` in production. Reserve `Mail::send()` for development and testing.

### Refactoring Strategy
1. Replace all `Mail::send()` with `Mail::queue()` in production code
2. Start queue workers for mail queue
3. Set appropriate `$timeout` on mailables
4. Remove synchronous mail from response path
5. Monitor mail queue throughput

### Detection Checklist
- [ ] `Mail::send()` in production code
- [ ] SMTP latency correlates with HTTP response time
- [ ] No queue worker processing mail
- [ ] Route-level latency on email-sending endpoints

### Related Rules/Skills/Decision Trees
- **Rule 4**: always-queue-mail-production (`05-rules.md`)
- **Decision 1**: Single Notification Job vs Separate Jobs per Channel (`07-decision-trees.md`)

---

## Anti-Pattern 5: Single Notification for Mixed-Speed Channels

### Category
Performance — Head-of-Line Blocking

### Description
Using a single notification class for channels with dramatically different latency profiles (e.g., fast database + slow SMS). The slow channel blocks the fast one, increasing total processing time.

### Why It Happens
Developers group all channels into one notification for convenience. The latency difference between channels is not considered during design.

### Warning Signs
- Single notification with both internal (database) and external (SMS, push) channels
- Database channel processing time increases proportionally with external channel latency
- Notification timeout due to slow external channel affecting all channels
- Monitoring shows notification processing time = sum of all channel times
- Fast channel's success depends on slow channel's reliability

### Why Harmful
Fast internal channels (database, in-memory) wait for slow external channels (SMS, push notification). A 100ms database write waits 10 seconds for an SMS API call. If the SMS fails, the database write is also lost (rolled back in retry).

### Real-World Consequences
A `LoginAlert` notification sends a database record and an SMS. The database write takes 50ms, but the SMS provider call takes 8 seconds. The user sees the alert in-app after 8 seconds instead of 50ms. When the SMS provider has a 30-second timeout, the entire notification fails — the in-app alert never appears, even though it would have worked independently.

### Preferred Alternative
Separate channels into individual notification classes. This allows independent parallel execution, timeout handling, and failure management.

### Refactoring Strategy
1. Create separate notification classes for each channel
2. Dispatch each channel's notification independently
3. Configure independent timeouts per channel
4. Handle failures independently
5. Monitor per-channel latency and success rates

### Detection Checklist
- [ ] Single notification with mixed internal/external channels
- [ ] Channel latency varies by >10x between channels
- [ ] Total notification time = sum of all channel times
- [ ] Database channel delayed by external API channel

### Related Rules/Skills/Decision Trees
- **Rule 5**: separate-notification-channels (`05-rules.md`)
- **Decision 1**: Single Notification Job vs Separate Jobs per Channel (`07-decision-trees.md`)
